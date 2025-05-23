/*
 * Copyright 2024, Riccardo Mari - CNR-Ibimet - Consorzio LaMMA.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
import React, { useState, useEffect } from 'react';
import Plot from '@mapstore/components/charts/PlotlyChart.jsx';
import {
    SPI_SPEI_CHART,
    CUMULATA_CHART,
    AIB_HISTORIC_CHART,
    AIB_PREVISIONALE,
    CLIMA_CHART,
    createVariableLineTraces,
    createBackgroundBands,
    createCumulataBarTraces,
    createObservedAndClimatologicalTraces,
    createLayout,
    createCumulataBarLayout
} from '../../utils/VariabiliMeteoUtils';
import moment from 'moment';
import momentLocaliser from 'react-widgets/lib/localizers/moment';
momentLocaliser(moment);

const InfoChartRender = ({
    dataFetched,
    variableChartParams,
    handleRelayout,
    chartRelayout,
    infoChartSize,
    isCollapsedFormGroup,
    unitPrecipitazione,
    format
}) => {
    const [traces, setTraces] = useState([]);
    const [layout, setLayout] = useState({});

    useEffect(() => {
        const dates = Array.isArray(dataFetched) ? dataFetched.map(item => moment(item.data).toDate())
            : dataFetched.data.map(item => moment(item.data).toDate());
        let newTraces = [];
        const chartTitle = variableChartParams.variables.name || "";
        const chartSubtitle = dataFetched.comune || "";
        const chartType = variableChartParams.chartType ||  variableChartParams.chartActive.chartType;
        let newLayout = {};

        // Calculate the traces and layout based on the chart type
        switch (chartType) {
        case SPI_SPEI_CHART:
            newTraces = createVariableLineTraces(variableChartParams.variables, dates, dataFetched);
            newTraces = createBackgroundBands(dates, variableChartParams.backgroundBands).concat(newTraces);
            newLayout = createLayout( variableChartParams.name || "", "", chartSubtitle, dates, format, newTraces, chartRelayout, infoChartSize, isCollapsedFormGroup, SPI_SPEI_CHART);
            break;
        case CLIMA_CHART:
            newTraces = createObservedAndClimatologicalTraces(variableChartParams, dates, dataFetched, unitPrecipitazione);
            newLayout = createLayout(variableChartParams.variables[0].name || "", variableChartParams.chartActive?.yaxis || variableChartParams.variables[0].yaxis, chartSubtitle, dates, format, newTraces, chartRelayout, infoChartSize, isCollapsedFormGroup, CLIMA_CHART);
            break;
        case CUMULATA_CHART:
            newTraces = createCumulataBarTraces(variableChartParams, dates, dataFetched);
            newLayout = createCumulataBarLayout(variableChartParams, variableChartParams.variables[0].name, newTraces, dates, format, chartRelayout, infoChartSize, isCollapsedFormGroup);
            break;
        case AIB_HISTORIC_CHART:
            newTraces = createVariableLineTraces(variableChartParams.variables, dates, dataFetched);
            newTraces = createBackgroundBands(dates, variableChartParams.variables[0].backgroundBands).concat(newTraces);
            newLayout = createLayout(variableChartParams.variables[0].name, "", chartSubtitle, dates, format, newTraces, chartRelayout, infoChartSize, isCollapsedFormGroup, AIB_HISTORIC_CHART);
            break;
        case AIB_PREVISIONALE:
            newTraces = createVariableLineTraces(variableChartParams.variables, dates, dataFetched);
            newTraces = createBackgroundBands(dates, variableChartParams.variables[0].backgroundBands).concat(newTraces);
            newLayout = createLayout(variableChartParams.variables[0].name, "", chartSubtitle, dates, format, newTraces, chartRelayout, infoChartSize, isCollapsedFormGroup, AIB_HISTORIC_CHART);
            break;
        default:
            newTraces = createVariableLineTraces(variableChartParams.variables, dates, dataFetched);
            newLayout = createLayout(chartTitle, "", chartSubtitle, dates, format, newTraces, chartRelayout, infoChartSize, isCollapsedFormGroup, SPI_SPEI_CHART);
            break;
        }
        // Merge the new traces with the previously set ones to preserve the visibility state
        setTraces(prevTraces => {
            if (!prevTraces || !prevTraces.length) {
                return newTraces;
            }
            return newTraces.map(newTrace => {
                const oldTrace = prevTraces.find(trace => trace.name === newTrace.name);
                return oldTrace ? { ...newTrace, visible: oldTrace.visible } : newTrace;
            });
        });
        setLayout(newLayout);
    }, [dataFetched, variableChartParams, unitPrecipitazione, format, infoChartSize, isCollapsedFormGroup]);

    // Function to toggle the visibility of the clicked trace
    const toggleLegendItem = (event) => {
        setTraces(prevTraces =>
            prevTraces.map((trace, index) =>
                index === event.curveNumber
                    ? { ...trace, visible: trace.visible === 'legendonly' ? true : 'legendonly' }
                    : trace
            )
        );
        return false; // Prevent the default Plotly behavior
    };
    return (
        <Plot
            data={traces}
            layout={layout}
            style={{ width: '100%', height: '100%' }}
            onRelayout={handleRelayout}
            onLegendClick={toggleLegendItem}
            config={{
                displayModeBar: true,
                modeBarButtonsToRemove: ['resetScale2d'],
                autosizable: true
            }}
        />
    );
};

export default InfoChartRender;
