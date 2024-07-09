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
import { CodeSnippet } from 'design-system';
import * as React from 'react';
import { CompilationInfo } from '../../components/CompilationInfo';
import { Arch, AutoConfig, BuildTools, OSs, TutorialConfig } from '../../types';
import {
  SONAR_SCANNER_CLI_LATEST_VERSION,
  getBuildWrapperExecutable,
  getBuildWrapperFolder,
  getScannerUrlSuffix,
  isCFamily,
} from '../../utils';

export interface PipeCommandProps {
  arch: Arch;
  buildTool: BuildTools;
  config: TutorialConfig;
  os: OSs;
  projectKey: string;
}

type ScriptFunction = (projectKey?: string, autoConfig?: AutoConfig) => string;

const BUILD_TOOL_SPECIFIC: {
  [key in BuildTools]: {
    image: string;
    script: ScriptFunction;
  };
} = {
  [BuildTools.Gradle]: {
    image: 'gradle:8.2.0-jdk17-jammy',
    script: () => 'gradle sonar',
  },
  [BuildTools.Maven]: {
    image: 'maven:3-eclipse-temurin-17',
    script: () => `
    - mvn verify sonar:sonar`,
  },
  [BuildTools.DotNet]: {
    image: 'mcr.microsoft.com/dotnet/sdk:7.0',
    script: (projectKey: string) => `
      - "apt-get update"
      - "apt-get install --yes --no-install-recommends openjdk-17-jre"
      - "dotnet tool install --global dotnet-sonarscanner"
      - "export PATH=\\"$PATH:$HOME/.dotnet/tools\\""
      - "dotnet sonarscanner begin /k:\\"${projectKey}\\" /d:sonar.token=\\"$SONAR_TOKEN\\" /d:\\"sonar.host.url=$SONAR_HOST_URL\\" "
      - "dotnet build"
      - "dotnet sonarscanner end /d:sonar.token=\\"$SONAR_TOKEN\\""`,
  },
  [BuildTools.Cpp]: {
    image: 'gcc',
    script: (autoConfig?: AutoConfig) =>
      `sonar-scanner/bin/sonar-scanner --define sonar.host.url="\${SONAR_HOST_URL}" ${autoConfig === AutoConfig.Manual ? `--define sonar.cfamily.compile-commands="\${BUILD_WRAPPER_OUT_DIR}/compile_commands.json"` : ''}`,
  },
  [BuildTools.ObjectiveC]: {
    image: 'gcc',
    script: (autoConfig?: AutoConfig) =>
      `sonar-scanner/bin/sonar-scanner --define sonar.host.url="\${SONAR_HOST_URL}" ${autoConfig === AutoConfig.Manual ? `--define sonar.cfamily.compile-commands="\${BUILD_WRAPPER_OUT_DIR}/compile_commands.json"` : ''}`,
  },
  [BuildTools.Other]: {
    image: `
    name: sonarsource/sonar-scanner-cli:latest
    entrypoint: [""]`,
    script: () => `
    - sonar-scanner`,
  },
};

export default function PipeCommand(props: Readonly<PipeCommandProps>) {
  const { projectKey, buildTool, config, os, arch } = props;
  const { autoConfig } = config;

  const { image, script } = BUILD_TOOL_SPECIFIC[buildTool];

  const suffix = getScannerUrlSuffix(os, arch);

  const getBinaries = `get-binaries:
  stage: get-binaries
  cache:
    policy: push
    key: "\${CI_COMMIT_SHORT_SHA}"
    paths:
      - sonar-scanner/
      ${autoConfig === AutoConfig.Manual ? `- build-wrapper/` : ''}
  script:
    # Download sonar-scanner
    - curl -sSLo ./sonar-scanner.zip 'https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-${SONAR_SCANNER_CLI_LATEST_VERSION}${suffix}.zip'
    - unzip -o sonar-scanner.zip
    - mv sonar-scanner-${SONAR_SCANNER_CLI_LATEST_VERSION}${suffix} sonar-scanner
    ${
      autoConfig === AutoConfig.Manual
        ? `# Download build-wrapper
    - curl -sSLo ./${getBuildWrapperFolder(os, arch)}.zip "$SONAR_HOST_URL/static/cpp/${getBuildWrapperFolder(os, arch)}.zip"
    - unzip -o ${getBuildWrapperFolder(os, arch)}.zip
    - mv ${getBuildWrapperFolder(os, arch)} build-wrapper`
        : ''
    }
        
  rules:
    - if: $CI_PIPELINE_SOURCE == 'merge_request_event'
    - if: $CI_COMMIT_BRANCH == 'master'
    - if: $CI_COMMIT_BRANCH == 'main'
    - if: $CI_COMMIT_BRANCH == 'develop'`;

  const build = `build:
  stage: build
  script:
    # prepare the build tree
    - mkdir build
    ${
      autoConfig === AutoConfig.Manual
        ? `- build-wrapper/${getBuildWrapperExecutable(os, arch)} --out-dir "\${BUILD_WRAPPER_OUT_DIR}" <your clean build command>`
        : ''
    }
  cache:
    policy: pull-push
    key: "\${CI_COMMIT_SHORT_SHA}"
    paths:
    - sonar-scanner/
    ${
      autoConfig === AutoConfig.Manual
        ? `- build-wrapper/
    - "\${BUILD_WRAPPER_OUT_DIR}"`
        : ''
    }`;

  const sonarqubeCheck = `sonarqube-check:
  stage: sonarqube-check
  dependencies:
    - get-binaries
    - build
  cache:
    policy: pull
    key: "\${CI_COMMIT_SHORT_SHA}"
    paths:
      - sonar-scanner/
      ${autoConfig === AutoConfig.Manual ? `- "\${BUILD_WRAPPER_OUT_DIR}"` : ''}
      
  script: ${script(projectKey, autoConfig)}
  allow_failure: true
  rules:
    - if: $CI_PIPELINE_SOURCE == 'merge_request_event'
    - if: $CI_COMMIT_BRANCH == 'master'
    - if: $CI_COMMIT_BRANCH == 'main'
    - if: $CI_COMMIT_BRANCH == 'develop'`;

  const vulnerabilityReport = `sonarqube-vulnerability-report:
  stage: sonarqube-vulnerability-report
  script:
    - 'curl -u "\${SONAR_TOKEN}:" "\${SONAR_HOST_URL}/api/issues/gitlab_sast_export?projectKey=${projectKey}&branch=\${CI_COMMIT_BRANCH}&pullRequest=\${CI_MERGE_REQUEST_IID}" -o gl-sast-sonar-report.json'
  allow_failure: true
  rules:
    - if: $CI_PIPELINE_SOURCE == 'merge_request_event'
    - if: $CI_COMMIT_BRANCH == 'master'
    - if: $CI_COMMIT_BRANCH == 'main'
    - if: $CI_COMMIT_BRANCH == 'develop'
  artifacts:
    expire_in: 1 day
    reports:
      sast: gl-sast-sonar-report.json
`;

  let stageDeclaration = ['sonarqube-check', 'sonarqube-vulnerability-report'];
  let stages = [sonarqubeCheck, vulnerabilityReport];

  if (buildTool === BuildTools.Cpp || buildTool === BuildTools.ObjectiveC) {
    // only for c-family languages on manual configuration
    stages = [getBinaries, build, ...stages];
    stageDeclaration = ['get-binaries', 'build', ...stageDeclaration];
  }

  const stageDefinition =
    stageDeclaration.length > 0
      ? `- ${stageDeclaration[0]}\n${stageDeclaration
          .slice(1)
          .map((stage) => `  - ${stage}`)
          .join('\n')}`
      : '';

  const variables = isCFamily(buildTool)
    ? `SONAR_USER_HOME: "\${CI_PROJECT_DIR}/.sonar"  # Defines the location of the analysis task cache
  GIT_DEPTH: "0"  # Tells git to fetch all the branches of the project, required by the analysis task
  ${autoConfig === AutoConfig.Manual ? `BUILD_WRAPPER_OUT_DIR: build_wrapper_output_directory # Directory where build-wrapper output will be placed` : ''}`
    : `SONAR_USER_HOME: "\${CI_PROJECT_DIR}/.sonar"  # Defines the location of the analysis task cache
  GIT_DEPTH: "0"  # Tells git to fetch all the branches of the project, required by the analysis task`;

  const command = `image: ${image}

variables:
  ${variables}

stages:
  ${stageDefinition}

${stages.join('\n\n')}`;

  return (
    <>
      <CodeSnippet className="sw-p-6" snippet={command} language="yml" />
      {buildTool === (BuildTools.Cpp || BuildTools.ObjectiveC) &&
        autoConfig === AutoConfig.Manual && <CompilationInfo />}
    </>
  );
}
