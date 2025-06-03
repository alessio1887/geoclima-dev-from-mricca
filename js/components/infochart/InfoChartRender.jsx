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
    createCumulataBarLayout, createAIBPrevTraces
} from '../../utils/VariabiliMeteoUtils';
import DateAPI from '../../utils/ManageDateUtils';
import moment from 'moment';
import momentLocaliser from 'react-widgets/lib/localizers/moment';
momentLocaliser(moment);

const InfoChartRender = ({
    dataFetched,
    chartParams,
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
        let newTraces = [];
        const chartTitle = chartParams.variables.name || "";
        const locationLabel  = dataFetched?.[0]?.comune || "";
        const chartType = chartParams.chartType ||  chartParams.chartActive.chartType;
        let newLayout = {};

        // Calculate the traces and layout based on the chart type
        switch (chartType) {
        case SPI_SPEI_CHART:
            newTraces = createVariableLineTraces(chartParams.variables, DateAPI.extractDates(dataFetched), dataFetched);
            newTraces = createBackgroundBands(DateAPI.extractDates(dataFetched), chartParams.backgroundBands).concat(newTraces);
            newLayout = createLayout( chartParams.name || "", "", locationLabel, DateAPI.extractDates(dataFetched), format, newTraces, chartRelayout,
                infoChartSize, isCollapsedFormGroup, chartParams.backgroundBands);
            break;
        case CLIMA_CHART:
            newTraces = createObservedAndClimatologicalTraces(chartParams, DateAPI.extractDates(dataFetched), dataFetched, unitPrecipitazione,
                chartParams.chartActive?.hideClimatologicalTrace);
            newLayout = createLayout(chartParams.variables[0].name || "", chartParams.chartActive?.yaxis || chartParams.variables[0].yaxis, locationLabel,
                DateAPI.extractDates(dataFetched), format, newTraces, chartRelayout, infoChartSize, isCollapsedFormGroup, chartParams.backgroundBands);
            break;
        case CUMULATA_CHART:
            newTraces = createCumulataBarTraces(chartParams, DateAPI.extractDates(dataFetched), dataFetched);
            newLayout = createCumulataBarLayout(chartParams, chartParams.variables[0].name, newTraces, DateAPI.extractDates(dataFetched), format, chartRelayout,
                infoChartSize, isCollapsedFormGroup);
            break;
        case AIB_HISTORIC_CHART:
            newTraces = createObservedAndClimatologicalTraces(chartParams, DateAPI.extractDates(dataFetched[0]?.osservato || []), dataFetched[0]?.osservato || [],
                unitPrecipitazione,  chartParams.chartActive?.hideClimatologicalTrace);
            newTraces = createBackgroundBands(DateAPI.extractDates(dataFetched[0]?.osservato || []), chartParams.variables[0].backgroundBands).concat(newTraces);
            newLayout = createLayout(chartParams.variables[0].name, "", locationLabel, DateAPI.extractDates(dataFetched[0]?.osservato || []), format, newTraces, chartRelayout,
                infoChartSize, isCollapsedFormGroup, chartParams.backgroundBands);
            break;
        case AIB_PREVISIONALE:
            newTraces = createAIBPrevTraces(chartParams.variables, dataFetched, format);
            newTraces = createBackgroundBands(DateAPI.extractPrevDates(dataFetched, format), chartParams.variables[0].backgroundBands).concat(newTraces);
            newLayout = createLayout(chartParams.variables[0].name, "", locationLabel, DateAPI.extractPrevDates(dataFetched, format), format, newTraces, chartRelayout, infoChartSize, isCollapsedFormGroup,
                chartParams.backgroundBands);
            break;
        default:
            newTraces = createVariableLineTraces(chartParams.variables, DateAPI.extractDates(dataFetched), dataFetched);
            newLayout = createLayout(chartTitle, "", locationLabel, DateAPI.extractDates(dataFetched), format, newTraces, chartRelayout, infoChartSize,
                isCollapsedFormGroup, chartParams.backgroundBands);
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
    }, [dataFetched, chartParams, unitPrecipitazione, format, infoChartSize, isCollapsedFormGroup]);

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
