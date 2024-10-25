/*
 * SonarQube
 * Copyright (C) 2009-2024 SonarSource SA
 * mailto:info AT sonarsource DOT com
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */

import { byLabelText, byRole, byText } from '~sonar-aligned/helpers/testSelector';
import SettingsServiceMock from '../../../api/mocks/SettingsServiceMock';
import { WorkspaceContext } from '../../../components/workspace/context';
import { mockIssue, mockRuleDetails } from '../../../helpers/testMocks';
import { renderComponent } from '../../../helpers/testReactTestingUtils';
import { SettingsKey } from '../../../types/settings';
import { Dict } from '../../../types/types';
import IssueHeader from '../components/IssueHeader';

const settingsHandler = new SettingsServiceMock();

beforeEach(() => {
  settingsHandler.reset();
});

it('renders correctly', async () => {
  const issue = mockIssue();
  renderIssueHeader(
    {
      issue: {
        ...issue,
        codeVariants: ['first', 'second'],
        effort: '5min',
        quickFixAvailable: true,
        externalRuleEngine: 'eslint',
      },
    },
    { eslint: 'eslint' },
  );

  // Title
  expect(await byRole('heading', { name: issue.message }).find()).toBeInTheDocument();

  // CCT attribute
  const cctBadge = await byText(
    `issue.clean_code_attribute_category.${issue.cleanCodeAttributeCategory}`,
  ).find();
  expect(cctBadge).toBeInTheDocument();
  await expect(cctBadge).toHaveAPopoverWithContent(
    `issue.clean_code_attribute.${issue.cleanCodeAttribute}`,
  );

  // Software Qualities
  const qualityBadge = byText(`software_quality.${issue.impacts[0].softwareQuality}`).get();
  expect(qualityBadge).toBeInTheDocument();
  await expect(qualityBadge).toHaveAPopoverWithContent('software_quality');
  expect(byLabelText(`severity_impact.${issue.impacts[0].severity}`).get()).toBeInTheDocument();

  // No old type
  expect(byText(`issue.type.${issue.type}`).query()).not.toBeInTheDocument();

  // No old severity
  expect(byText(`severity.${issue.severity}`).query()).not.toBeInTheDocument();

  // Code variants
  expect(byText('issue.code_variants').get()).toBeInTheDocument();

  // Effort
  expect(byText('issue.effort').get()).toBeInTheDocument();

  // SonarLint badge
  expect(byText('issue.quick_fix').get()).toBeInTheDocument();

  // Rule external engine
  expect(byText('eslint').get()).toBeInTheDocument();
});

it('renders correctly for Standard mode', async () => {
  const issue = mockIssue();
  settingsHandler.set(SettingsKey.MQRMode, 'false');
  renderIssueHeader({
    issue,
  });

  // Shows old type
  expect(await byText(`issue.type.${issue.type}`).find()).toBeInTheDocument();

  // Shows old severity
  expect(byLabelText(`severity.${issue.severity}`).get()).toBeInTheDocument();

  // No CCT attribute
  expect(
    byText(`issue.clean_code_attribute_category.${issue.cleanCodeAttributeCategory}`).query(),
  ).not.toBeInTheDocument();

  // No Software Qualities
  expect(
    byText(`software_quality.${issue.impacts[0].softwareQuality}`).query(),
  ).not.toBeInTheDocument();
});

it('renders correctly when some data is not provided', () => {
  const issue = mockIssue();
  renderIssueHeader({
    issue,
  });

  // Code variants
  expect(byText('issues.facet.code_variants').query()).not.toBeInTheDocument();

  // Effort
  expect(byText('issue.effort').query()).not.toBeInTheDocument();

  // SonarLint badge
  expect(
    byText('issue.quick_fix_available_with_sonarlint_no_link').query(),
  ).not.toBeInTheDocument();

  // Rule external engine
  expect(byText('eslint').query()).not.toBeInTheDocument();
});

function renderIssueHeader(
  props: Partial<IssueHeader['props']> = {},
  externalRules: Dict<string> = {},
) {
  return renderComponent(
    <WorkspaceContext.Provider
      value={{ openComponent: jest.fn(), externalRulesRepoNames: externalRules }}
    >
      <IssueHeader
        issue={mockIssue()}
        ruleDetails={mockRuleDetails()}
        onIssueChange={jest.fn()}
        {...props}
      />
    </WorkspaceContext.Provider>,
  );
}
