/*
 * SonarQube
 * Copyright (C) 2009-2025 SonarSource SA
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
package org.sonar.server.platform.db.migration.version.v202506;

import java.sql.SQLException;
import java.sql.Types;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.sonar.db.MigrationDbTester;

import static org.sonar.server.platform.db.migration.version.v202506.CreateXsrfTokensTable.COLUMN_CREATED_AT;
import static org.sonar.server.platform.db.migration.version.v202506.CreateXsrfTokensTable.COLUMN_ID;
import static org.sonar.server.platform.db.migration.version.v202506.CreateXsrfTokensTable.COLUMN_UPDATED_AT;
import static org.sonar.server.platform.db.migration.version.v202506.CreateXsrfTokensTable.COLUMN_USER_UUID;
import static org.sonar.server.platform.db.migration.version.v202506.CreateXsrfTokensTable.XSRF_TOKENS_TABLE_NAME;

class CreateXsrfTokensTableTest {

  @RegisterExtension
  public final MigrationDbTester db = MigrationDbTester.createForMigrationStep(CreateXsrfTokensTable.class);

  private final CreateXsrfTokensTable underTest = new CreateXsrfTokensTable(db.database());

  @Test
  void migration_should_create_table() throws SQLException {
    db.assertTableDoesNotExist(XSRF_TOKENS_TABLE_NAME);

    underTest.execute();

    db.assertTableExists(XSRF_TOKENS_TABLE_NAME);
    db.assertPrimaryKey(XSRF_TOKENS_TABLE_NAME, "pk_xsrf_tokens", COLUMN_ID);
    db.assertColumnDefinition(XSRF_TOKENS_TABLE_NAME, COLUMN_ID, Types.VARCHAR, 40, false);
    db.assertColumnDefinition(XSRF_TOKENS_TABLE_NAME, COLUMN_USER_UUID, Types.VARCHAR, 40, false);
    db.assertColumnDefinition(XSRF_TOKENS_TABLE_NAME, COLUMN_CREATED_AT, Types.BIGINT, null, false);
    db.assertColumnDefinition(XSRF_TOKENS_TABLE_NAME, COLUMN_UPDATED_AT, Types.BIGINT, null, false);
  }

  @Test
  void migration_should_be_reentrant() throws SQLException {
    db.assertTableDoesNotExist(XSRF_TOKENS_TABLE_NAME);

    underTest.execute();
    underTest.execute();

    db.assertTableExists(XSRF_TOKENS_TABLE_NAME);
  }
}

