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
import { ButtonSecondary } from 'design-system';
import * as React from 'react';
import { AutoSizer } from 'react-virtualized/dist/commonjs/AutoSizer';
import { formatMeasure } from '~sonar-aligned/helpers/measures';
import { AdvancedTimeline } from '../../components/charts/AdvancedTimeline';
import { translate } from '../../helpers/l10n';
import { getShortType } from '../../helpers/measures';
import { MeasureHistory, ParsedAnalysis, Serie } from '../../types/project-activity';
import ModalButton from '../controls/ModalButton';
import DataTableModal from './DataTableModal';
import GraphsLegendCustom from './GraphsLegendCustom';
import GraphsLegendStatic from './GraphsLegendStatic';
import { GraphsTooltips } from './GraphsTooltips';
import { getAnalysisEventsForDate } from './utils';

interface Props {
  analyses: ParsedAnalysis[];
  canShowDataAsTable?: boolean;
  graph: string;
  graphDescription: string;
  graphEndDate?: Date;
  graphStartDate?: Date;
  isCustom?: boolean;
  leakPeriodDate?: Date;
  measuresHistory: MeasureHistory[];
  metricsType: string;
  removeCustomMetric?: (metric: string) => void;
  selectedDate?: Date;
  series: Serie[];
  showAreas: boolean;
  updateGraphZoom?: (from?: Date, to?: Date) => void;
  updateSelectedDate?: (selectedDate?: Date) => void;
  updateTooltip: (selectedDate?: Date) => void;
}

export default function GraphHistory(props: Readonly<Props>) {
  const {
    analyses,
    canShowDataAsTable = true,
    graph,
    graphEndDate,
    graphStartDate,
    isCustom,
    leakPeriodDate,
    measuresHistory,
    metricsType,
    selectedDate,
    series,
    showAreas,
    graphDescription,
  } = props;
  const [tooltipIdx, setTooltipIdx] = React.useState<number | undefined>(undefined);
  const [tooltipXPos, setTooltipXPos] = React.useState<number | undefined>(undefined);

  const formatValue = (tick: string | number) => {
    return formatMeasure(tick, getShortType(metricsType));
  };

  const formatTooltipValue = (tick: string | number) => {
    return formatMeasure(tick, metricsType);
  };

  const updateTooltip = (selectedDate?: Date, tooltipXPos?: number, tooltipIdx?: number) => {
    props.updateTooltip(selectedDate);
    setTooltipIdx(tooltipIdx);
    setTooltipXPos(tooltipXPos);
  };

  const modalProp = ({ onClose }: { onClose: () => void }) => (
    <DataTableModal
      analyses={analyses}
      graphEndDate={graphEndDate}
      graphStartDate={graphStartDate}
      series={series}
      onClose={onClose}
    />
  );

  const events = getAnalysisEventsForDate(analyses, selectedDate);

  return (
    <StyledGraphContainer className="sw-flex sw-flex-col sw-justify-center sw-items-stretch sw-grow sw-py-2">
      {isCustom && props.removeCustomMetric ? (
        <GraphsLegendCustom
          leakPeriodDate={leakPeriodDate}
          removeMetric={props.removeCustomMetric}
          series={series}
        />
      ) : (
        <GraphsLegendStatic leakPeriodDate={leakPeriodDate} series={series} />
      )}

      <div className="sw-flex-1">
        <AutoSizer>
          {({ height, width }) => (
            <div>
              <AdvancedTimeline
                endDate={graphEndDate}
                formatYTick={formatValue}
                height={height}
                leakPeriodDate={leakPeriodDate}
                splitPointDate={measuresHistory.find((m) => m.splitPointDate)?.splitPointDate}
                metricType={metricsType}
                selectedDate={selectedDate}
                series={series}
                showAreas={showAreas}
                startDate={graphStartDate}
                graphDescription={graphDescription}
                updateSelectedDate={props.updateSelectedDate}
                updateTooltip={updateTooltip}
                updateZoom={props.updateGraphZoom}
                width={width}
              />

              {selectedDate !== undefined &&
                tooltipIdx !== undefined &&
                tooltipXPos !== undefined && (
                  <GraphsTooltips
                    events={events}
                    formatValue={formatTooltipValue}
                    graph={graph}
                    graphWidth={width}
                    measuresHistory={measuresHistory}
                    selectedDate={selectedDate}
                    series={series}
                    tooltipIdx={tooltipIdx}
                    tooltipPos={tooltipXPos}
                  />
                )}
            </div>
          )}
        </AutoSizer>
      </div>
      {canShowDataAsTable && (
        <ModalButton modal={modalProp}>
          {({ onClick }) => (
            <ButtonSecondary className="sw-sr-only" onClick={onClick}>
              {translate('project_activity.graphs.open_in_table')}
            </ButtonSecondary>
          )}
        </ModalButton>
      )}
    </StyledGraphContainer>
  );
}

const StyledGraphContainer = styled.div`
  height: 300px;
`;
