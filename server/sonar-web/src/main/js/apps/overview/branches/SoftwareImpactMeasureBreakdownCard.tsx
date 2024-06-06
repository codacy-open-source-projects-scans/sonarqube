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
import styled from '@emotion/styled';
import { Tooltip } from '@sonarsource/echoes-react';
import classNames from 'classnames';
import { DiscreetLinkBox, themeColor, themeContrast } from 'design-system';
import * as React from 'react';
import { useIntl } from 'react-intl';
import { formatMeasure } from '~sonar-aligned/helpers/measures';
import { getComponentIssuesUrl } from '~sonar-aligned/helpers/urls';
import { MetricType } from '~sonar-aligned/types/metrics';
import { DEFAULT_ISSUES_QUERY } from '../../../components/shared/utils';
import { Branch } from '../../../types/branch-like';
import { SoftwareImpactSeverity, SoftwareQuality } from '../../../types/clean-code-taxonomy';
import { Component } from '../../../types/types';

export interface SoftwareImpactMeasureBreakdownCardProps {
  active?: boolean;
  branch?: Branch;
  component: Component;
  severity: SoftwareImpactSeverity;
  softwareQuality: SoftwareQuality;
  value?: string;
}

export function SoftwareImpactMeasureBreakdownCard(
  props: Readonly<SoftwareImpactMeasureBreakdownCardProps>,
) {
  const { softwareQuality, component, value, severity, active, branch } = props;

  const intl = useIntl();

  const url = getComponentIssuesUrl(component.key, {
    ...DEFAULT_ISSUES_QUERY,
    impactSoftwareQualities: softwareQuality,
    impactSeverities: severity,
    branch: branch?.name,
  });

  const testId = `overview__software-impact-${softwareQuality}-severity-${severity}`;
  const cardClasses =
    'sw-w-1/3 sw-px-2 sw-py-1 sw-rounded-1 sw-text-xs sw-font-semibold sw-select-none sw-flex sw-gap-1 sw-justify-center sw-items-center';

  if (!value) {
    return (
      <StyledBreakdownCard
        data-testid={testId}
        className={classNames(cardClasses, severity, {
          active,
        })}
      >
        -
      </StyledBreakdownCard>
    );
  }

  return (
    <Tooltip
      content={intl.formatMessage({
        id: `overview.measures.software_impact.severity.${severity}.tooltip`,
      })}
    >
      <StyledBreakdownLinkCard
        data-testid={testId}
        className={classNames(cardClasses, severity, {
          active,
        })}
        aria-label={intl.formatMessage(
          {
            id: 'overview.measures.software_impact.severity.see_x_open_issues',
          },
          {
            count: formatMeasure(value, MetricType.ShortInteger),
            softwareQuality: intl.formatMessage({
              id: `software_quality.${softwareQuality}`,
            }),
            severity: intl.formatMessage({
              id: `overview.measures.software_impact.severity.${severity}.tooltip`,
            }),
          },
        )}
        disabled={component.needIssueSync}
        to={url}
      >
        <span>{formatMeasure(value, MetricType.ShortInteger)}</span>
        <span>
          {intl.formatMessage({
            id: `overview.measures.software_impact.severity.${severity}`,
          })}
        </span>
      </StyledBreakdownLinkCard>
    </Tooltip>
  );
}

const StyledBreakdownCard = styled.div`
  background-color: ${themeColor('overviewSoftwareImpactSeverityNeutral')};

  &.active.HIGH {
    background-color: ${themeColor('overviewSoftwareImpactSeverityHigh')};
    color: ${themeContrast('overviewSoftwareImpactSeverityHigh')};
  }
  &.active.MEDIUM {
    background-color: ${themeColor('overviewSoftwareImpactSeverityMedium')};
    color: ${themeContrast('overviewSoftwareImpactSeverityMedium')};
  }
  &.active.LOW {
    background-color: ${themeColor('overviewSoftwareImpactSeverityLow')};
    color: ${themeContrast('overviewSoftwareImpactSeverityLow')};
  }
`;
const StyledBreakdownLinkCard = StyledBreakdownCard.withComponent(DiscreetLinkBox);

export default SoftwareImpactMeasureBreakdownCard;
