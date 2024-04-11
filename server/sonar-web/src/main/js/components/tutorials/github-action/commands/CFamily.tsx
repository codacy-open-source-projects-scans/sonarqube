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
import { NumberedListItem } from 'design-system';
import * as React from 'react';
import { translate } from '../../../../helpers/l10n';
import { Component } from '../../../../types/types';
import { CompilationInfo } from '../../components/CompilationInfo';
import CreateYmlFile from '../../components/CreateYmlFile';
import DefaultProjectKey from '../../components/DefaultProjectKey';
import GithubCFamilyExampleRepositories from '../../components/GithubCFamilyExampleRepositories';
import RenderOptions from '../../components/RenderOptions';
import { OSs, TutorialModes } from '../../types';
import { generateGitHubActionsYaml } from '../utils';
import MonorepoDocLinkFallback from './MonorepoDocLinkFallback';

export interface CFamilyProps {
  branchesEnabled?: boolean;
  mainBranchName: string;
  monorepo?: boolean;
  component: Component;
}

const STEPS = {
  [OSs.Linux]: `
      - name: Install sonar-scanner and build-wrapper
        env:
          SONAR_HOST_URL: \${{secrets.SONAR_HOST_URL}}
        uses: SonarSource/sonarqube-github-c-cpp@v1
      - name: Run build-wrapper
        run: |
          build-wrapper-linux-x86-64 --out-dir \${{ env.BUILD_WRAPPER_OUT_DIR }} <insert_your_clean_build_command>
      - name: Run sonar-scanner
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: \${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: \${{secrets.SONAR_HOST_URL}}
        run: |
          sonar-scanner --define sonar.cfamily.build-wrapper-output="\${{ env.BUILD_WRAPPER_OUT_DIR }}"`,
  [OSs.MacOS]: `
      - name: Install sonar-scanner and build-wrapper
        env:
          SONAR_HOST_URL: \${{secrets.SONAR_HOST_URL}}
        uses: SonarSource/sonarqube-github-c-cpp@v1
      - name: Run build-wrapper
        run: |
          build-wrapper-macosx-x86 --out-dir \${{ env.BUILD_WRAPPER_OUT_DIR }} <insert_your_clean_build_command>
      - name: Run sonar-scanner
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: \${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: \${{secrets.SONAR_HOST_URL}}
        run: |
          sonar-scanner --define sonar.cfamily.build-wrapper-output="\${{ env.BUILD_WRAPPER_OUT_DIR }}"`,
  [OSs.Windows]: `
      - name: Install sonar-scanner and build-wrapper
        env:
          SONAR_HOST_URL: \${{secrets.SONAR_HOST_URL}}
        uses: SonarSource/sonarqube-github-c-cpp@v1
      - name: Run build-wrapper
        run: |
          build-wrapper-win-x86-64 --out-dir \${{ env.BUILD_WRAPPER_OUT_DIR }} <insert_your_clean_build_command>
      - name: Run sonar-scanner
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: \${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: \${{secrets.SONAR_HOST_URL}}
        run: |
          sonar-scanner --define sonar.cfamily.build-wrapper-output="\${{ env.BUILD_WRAPPER_OUT_DIR }}"`,
};

export default function CFamily(props: CFamilyProps) {
  const { component, branchesEnabled, mainBranchName, monorepo } = props;
  const [os, setOs] = React.useState<undefined | OSs>(OSs.Linux);

  const runsOn = {
    [OSs.Linux]: 'ubuntu-latest',
    [OSs.MacOS]: 'macos-latest',
    [OSs.Windows]: 'windows-latest',
  };
  return (
    <>
      <DefaultProjectKey component={component} monorepo={monorepo} />
      <NumberedListItem>
        <span>{translate('onboarding.build.other.os')}</span>
        <RenderOptions
          label={translate('onboarding.build.other.os')}
          checked={os}
          onCheck={(value: OSs) => setOs(value)}
          optionLabelKey="onboarding.build.other.os"
          options={Object.values(OSs)}
        />
        {os && (
          <GithubCFamilyExampleRepositories
            className="sw-mt-4 sw-w-abs-600"
            os={os}
            ci={TutorialModes.GitHubActions}
          />
        )}
      </NumberedListItem>
      {os &&
        (monorepo ? (
          <MonorepoDocLinkFallback />
        ) : (
          <>
            <CreateYmlFile
              yamlFileName=".github/workflows/build.yml"
              yamlTemplate={generateGitHubActionsYaml(
                mainBranchName,
                !!branchesEnabled,
                runsOn[os],
                STEPS[os],
                `env:
      BUILD_WRAPPER_OUT_DIR: build_wrapper_output_directory # Directory where build-wrapper output will be placed`,
              )}
            />
            <CompilationInfo />
          </>
        ))}
    </>
  );
}
