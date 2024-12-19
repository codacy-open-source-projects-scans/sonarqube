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
package org.sonar.server.v2.api.analysis.service;

import java.util.List;
import org.sonar.db.DbClient;
import org.sonar.db.DbSession;
import org.sonar.server.rule.ActiveRuleRestReponse;
import org.sonar.server.rule.ActiveRuleService;

public class ActiveRulesHandlerImpl implements ActiveRulesHandler {

  private final DbClient dbClient;
  private final ActiveRuleService activeRuleService;

  public ActiveRulesHandlerImpl(DbClient dbClient, ActiveRuleService activeRuleService) {
    this.dbClient = dbClient;
    this.activeRuleService = activeRuleService;
  }

  @Override
  public List<ActiveRuleRestReponse.ActiveRule> getActiveRules(String projectKey) {
    try (DbSession dbSession = dbClient.openSession(false)) {
      return dbClient.projectDao().selectProjectByKey(dbSession, projectKey)
        .map(projectDto -> activeRuleService.buildActiveRules(projectDto.getUuid()))
        .orElse(activeRuleService.buildDefaultActiveRules());
    }
  }

}
