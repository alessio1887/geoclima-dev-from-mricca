/*
 * Copyright 2024, Riccardo Mari - CNR-Ibimet - Consorzio LaMMA.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
import React from 'react';
import PropTypes from 'prop-types';
import { Resizable } from 'react-resizable';

import { Collapse, Button, Glyphicon} from 'react-bootstrap';
import Message from '@mapstore/components/I18N/Message';

import Dialog from '@mapstore/components/misc/Dialog';
import BorderLayout from '@mapstore/components/layout/BorderLayout';
import InfoChartForm from './InfoChartForm';
import InfoChartRender from './InfoChartRender';
import DateAPI, { DATE_FORMAT, DEFAULT_DATA_INIZIO, DEFAULT_DATA_FINE } from '../../utils/ManageDateUtils';
import { FIXED_RANGE, MARKER_ID, MULTI_VARIABLE_CHART, AIB_HISTORIC_CHART,
    getStartPositionPanel, getDefaultPanelSize }  from '../../utils/VariabiliMeteoUtils';
import { get, isEqual } from 'lodash';
import moment from 'moment';
import momentLocaliser from 'react-widgets/lib/localizers/moment';
momentLocaliser(moment);

import 'react-resizable/css/styles.css';
import './infochart.css';

class InfoChart extends React.Component {
    static propTypes = {
        id: PropTypes.string,
        isFetchAvailableDates: PropTypes.bool, // If true, fetch the first and last available dates calling fetchSelectDate action
        panelClassName: PropTypes.string,
        closeGlyph: PropTypes.string,
        onSetInfoChartVisibility: PropTypes.func,
        onFetchInfoChartData: PropTypes.func,
        onCollapseRangePicker: PropTypes.func,
        onSetInfoChartDates: PropTypes.func,
        onSetChartRelayout: PropTypes.func,
        onResetChartZoom: PropTypes.func,
        onResizeInfoChart: PropTypes.func,
        onSetDafaultPanelSize: PropTypes.func,
        onSetRangeManager: PropTypes.func,
        onChangeChartType: PropTypes.func,
        onSetTabList: PropTypes.func,
        onHideMapinfoMarker: PropTypes.func,
        show: PropTypes.bool,
        infoChartData: PropTypes.object,
        tabVariables: PropTypes.array,
        maskLoading: PropTypes.bool,
        // data fetched by epic loadInfoChartDataEpic
        data: PropTypes.array,
        glyphicon: PropTypes.string,
        text: PropTypes.string,
        btnSize: PropTypes.oneOf(['large', 'small', 'xsmall']),
        btnType: PropTypes.oneOf(['normal', 'image']),
        help: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
        tooltip: PropTypes.element,
        tooltipPlace: PropTypes.string,
        className: PropTypes.string,
        bsStyle: PropTypes.string,
        onToggleControl: PropTypes.func,
        onInitializeVariableTabs: PropTypes.func,
        active: PropTypes.bool,
        mapinfoActive: PropTypes.bool,
        animated: PropTypes.bool,
        fromData: PropTypes.instanceOf(Date),
        toData: PropTypes.instanceOf(Date),
        firstAvailableDate: PropTypes.instanceOf(Date),
        lastAvailableDate: PropTypes.instanceOf(Date),
        variables: PropTypes.array,
        periodType: PropTypes.object,
        periodTypes: PropTypes.array,
        classNameInfoChartDate: PropTypes.string,
        styleInfoChartDate: PropTypes.object,
        isInteractionDisabled: PropTypes.bool,
        isCollapsedFormGroup: PropTypes.bool,
        activeRangeManager: PropTypes.string,
        alertMessage: PropTypes.string,
        chartRelayout: PropTypes.object,
        infoChartSize: PropTypes.object,
        unitPrecipitazione: PropTypes.string,
        unitTemperatura: PropTypes.string,
        tabList: PropTypes.array,
        idVariabiliLayers: PropTypes.object,
        defaultUrlGeoclimaChart: PropTypes.string,
        defaultUrlSelectDate: PropTypes.string,
        variabileSelectDate: PropTypes.string,
        timeUnit: PropTypes.string,
        isPluginLoaded: PropTypes.bool
    }
    static defaultProps = {
        id: "mapstore-sarchart-panel",
        panelClassName: "toolbar-panel portal-dialog",
        closeGlyph: "1-close",
        onChangeChartType: () => {},
        onCollapseRangePicker: () => {},
        onSetInfoChartVisibility: () => {},
        onFetchInfoChartData: () => {},
        onSetRangeManager: () => {},
        onSetInfoChartDates: () => {},
        onSetTabList: () => {},
        onSetChartRelayout: () => {},
        onResetChartZoom: () => {},
        onResizeInfoChart: () => {},
        onSetDafaultPanelSize: () => {},
        onInitializeVariableTabs: () => {},
        unitPrecipitazione: "mm",
        unitTemperatura: "°C",
        periodTypes: [
            { "key": "1", "label": "1 Mese" },
            { "key": "3", "label": "3 Mesi" },
            { "key": "4", "label": "4 Mesi" },
            { "key": "6", "label": "6 Mesi" },
            { "key": "12", "label": "12 Mesi" },
            { "key": "10", "label": "dal 1° Ottobre" }
        ],
        idVariabiliLayers: {
            "prec": ["Pioggia_Anomalia_perc", "Pioggia_Anomalia_mm", "Pioggia_Cumulata", "Pioggia_Cumulata_clima"],
            "tmed": ["Temperatura_Media", "Temperatura_Media_Anomalia", "Temperatura_Media_clima"],
            "tmin": ["Temperatura_Minima", "Temperatura_Minima_Anomalia", "Temperatura_Minima_clima"],
            "tmax": [ "Temperatura_Massima", "Temperatura_Massima_Anomalia", "Temperatura_Massima_clima"],
            "ret": ["Evapotraspirazione", "Evapotraspirazione_Anomalia_mm", "Evapotraspirazione_Anomalia_perc", "Evapotraspirazione_clima"],
            "bis": ["BilancioIdricoSemplificato", "BilancioIdricoSemplificato_Anomalia_mm", "BilancioIdricoSemplificato_Anomalia_perc",
                "BilancioIdricoSemplificato_clima"]
        },
        tabList: [
            {"id": "variableList", "name": "Variabili Meteo", "groupList": [
                { "id": "prec", "name": "Precipitazione" },
                { "id": "tmed", "name": "Temperatura Media" },
                { "id": "tmax", "name": "Temperatura Massima" },
                { "id": "tmin", "name": "Temperatura Minima" },
                { "id": "ret", "name": "Evapotraspirazione Potenziale" },
                { "id": "bis", "name": "Bilancio Idrico Semplificato" }
            ],
            "type": "single_select"
            },
            {"id": "spiList", "name": "SPI", "groupList": [
                { "id": "spi1", "name": "SPI-1" },
                { "id": "spi3", "name": "SPI-3" },
                { "id": "spi6", "name": "SPI-6" },
                { "id": "spi12", "name": "SPI-12" }
            ],
            "chartTitle": "Indice SPI - Standardized Precipitation Index",
            "type": "multi_select"
            },
            {"id": "speiList", "name": "SPEI", "groupList": [
                { "id": "spei1", "name": "SPEI-1" },
                { "id": "spei3", "name": "SPEI-3" },
                { "id": "spei6", "name": "SPEI-6" },
                { "id": "spei12", "name": "SPEI-12" }
            ],
            "chartTitle": "Indice SPEI - Standardized Precipitation-Evapotranspiration Index",
            "type": "multi_select"
            }
        ],
        defaultUrlGeoclimaChart: 'geoportale.lamma.rete.toscana.it/cgi-bin/geoclima_app/geoclima_chart.py',
        defaultUrlSelectDate: "geoportale.lamma.rete.toscana.it/cgi-bin/geoclima_app/selectDate.py",
        variabileSelectDate: "prec",
        show: false,
        infoChartData: {},
        maskLoading: true,
        data: [],
        glyphicon: "signal",
        text: undefined,
        btnSize: 'xsmall',
        btnType: 'normal',
        tooltipPlace: "left",
        bsStyle: "primary",
        className: "square-button",
        onToggleControl: () => {},
        active: false,
        mapinfoActive: false,
        animated: true,
        classNameInfoChartDate: "mapstore-infochartdate",
        isCollapsedFormGroup: false,
        infoChartSize: {
            defaultWidth: 880,
            defaultHeight: 880,
            widthResizable: 880,
            heightResizable: 880
        },
        firstAvailableDate: DEFAULT_DATA_INIZIO,
        lastAvailableDate: DEFAULT_DATA_FINE,
        timeUnit: DATE_FORMAT,
        isPluginLoaded: false
    }

    state = {
        // Default date values to use in case of invalid or missing date input
        fromDataSelected: moment(this.props.fromData).clone().format(this.props.timeUnit),
        toDataSelected: moment(this.props.toData).clone().format(this.props.timeUnit)
        // periodTypeSelected: this.props.periodType
    }

    initializeTabs = () => {
        const variableTabs = this.props.tabList.map((tab, index) => ({
            id: tab.id,
            variables: [tab.groupList[0]],
            active: index === 0,
            chartType: tab.chartType,
            chartTitle: tab.chartTitle,
            backgroundBands: Array.isArray(tab.backgroundBands) && tab.backgroundBands.length > 0
                ? tab.backgroundBands
                : [],
            ...(tab.chartList && { chartList: tab.chartList })
        }));
        this.props.onInitializeVariableTabs(variableTabs);
    }
    // Set some props to the plugin's state
    componentDidMount() {
        if (!this.props.isPluginLoaded) {
            this.props.onSetIdVariabiliLayers(this.props.idVariabiliLayers);
            this.props.onSetTabList(this.props.tabList);
            this.props.onSetTimeUnit(this.props.timeUnit);
            this.initializeTabs();
            this.props.onSetDefaultUrlGeoclimaChart(this.props.defaultUrlGeoclimaChart);
            const defaultPeriod = DateAPI.getDefaultPeriod(this.props.periodTypes);
            this.props.onChangePeriod(defaultPeriod);
            if ( this.props.isFetchAvailableDates && this.props.defaultUrlSelectDate && this.props.variabileSelectDate) {
                this.props.onFetchAvailableDates(this.props.variabileSelectDate, this.props.defaultUrlSelectDate, this.props.timeUnit, defaultPeriod);
            }
            // Set panel size
            const { width: newWidth, height: newHeight } = getDefaultPanelSize();
            this.props.onSetDafaultPanelSize(newWidth, newHeight);
            this.props.onMarkPluginAsLoaded();
        }
    }

    shouldComponentUpdate(newProps) {
        // List of prop to compare
        const propsToCompare = ['show', 'maskLoading', 'active', 'mapinfoActive', 'tabVariables', 'data',
            'fromData', 'toData', 'periodType', 'isInteractionDisabled', 'isCollapsedFormGroup',
            'activeRangeManager', 'alertMessage', 'infoChartSize', 'isPluginLoaded', 'chartRelayout'
        ];
        for (let key of propsToCompare) {
        // Use get to access nested properties
            if (!isEqual(get(newProps, key), get(this.props, key))) {
                return true; // Aggiorna il componente se c'è una differenza
            }
        }
        // None of the selected properties have changed
        return false;
    }
    onResize = (event, { size }) => {
        // Aggiorna le dimensioni del pannello
        this.props.onResizeInfoChart(size.width, size.height);
    };
    handleRelayout = (eventData) => {
        // Autoscale case: reset zoom data to default values
        if (eventData['xaxis.autorange'] || eventData['yaxis.autorange'] || eventData['yaxis2.autorange']) {
            this.props.onResetChartZoom();
        } else {
            const zoomData = this.props.chartRelayout ? { ...this.props.chartRelayout } : {};
            if (eventData['xaxis.range[0]'] && eventData['xaxis.range[1]']) {
                zoomData.startDate = new Date(eventData['xaxis.range[0]']);
                zoomData.endDate = new Date(eventData['xaxis.range[1]']);
            }
            if (eventData['yaxis.range[0]'] && eventData['yaxis.range[1]']) {
                zoomData.yaxisStart = eventData['yaxis.range[0]'];
                zoomData.yaxisEnd = eventData['yaxis.range[1]'];
            }
            if (eventData['yaxis2.range[0]'] && eventData['yaxis2.range[1]']) {
                zoomData.yaxis2Start = eventData['yaxis2.range[0]'];
                zoomData.yaxis2End = eventData['yaxis2.range[1]'];
            }
            if (eventData.dragmode) {
                zoomData.dragmode = eventData.dragmode;
            }
            this.props.onSetChartRelayout(zoomData);
        }
    };
    handleChangeChartType = (idChartType) => {
        this.props.onChangeChartType(idChartType);
        this.props.onResetChartZoom();
    }
    getActiveTab = () => {
        return this.props.tabVariables.find(tab => tab.active === true);
    }
    // Get the selected tab's parameters (chart title, chart list, etc.) based on the traces applied to the chart.
    getMultiVariableChartParams = (activeTab) => {
        return {
            tabVariableParams: activeTab.variables,
            name: activeTab.chartTitle,
            chartType: activeTab.chartType,
            backgroundBands: activeTab.backgroundBands
        };
    };
    getSingleVariableChartParams = (tabSelected) => {
        const variableParams = tabSelected.variables[0];
        let chartParams;
        const chartList = variableParams.chartList || tabSelected.chartList || [];
        if (Array.isArray(chartList) && chartList.length > 0) {
            const chartActive = chartList.find(chart => chart.active) || chartList[0];
            chartParams = {
                id: variableParams.id,
                name: variableParams.name,
                unit: chartActive.unit,
                yaxis: chartActive.yaxis,
                yaxis2: chartActive.yaxis2,
                chartType: chartActive.chartType || "",
                chartStyle1: chartActive.chartStyle1,
                chartStyle2: chartActive.chartStyle2,
                backgroundBands: variableParams.backgroundBands,
                showOneDatePicker: chartActive.showOneDatePicker || false
            };
        } else {
            chartParams = {
                ...variableParams,
                // chartType: tabSelected.chartType,
                backgroundBands: variableParams.backgroundBands
            };
        }
        return chartParams;
    };

    getChartTypeSelected = () => {
        let chartTypeSelected = {};
        const activeTab = this.getActiveTab();
        if (activeTab.chartType === MULTI_VARIABLE_CHART) {
            chartTypeSelected = this.getMultiVariableChartParams(activeTab);
        } else {
            chartTypeSelected = this.getSingleVariableChartParams(activeTab);
        }
        return chartTypeSelected;
    }
    showChart = (chartTypeSelected) => {

        // TOREMOVE - AIB charts
        let chartData = this.props.data;
        const activeTab = this.getActiveTab();
        if ( activeTab.id === 'aib') {
            if (chartTypeSelected.chartType === AIB_HISTORIC_CHART) {
                chartData = wildfireData;
            } else {
                chartData = wildfireData.slice(0, 3);
            }
        }

        return (
            <InfoChartRender
                dataFetched = { chartData }
                handleRelayout= { this.handleRelayout }
                chartRelayout= { this.props.chartRelayout}
                infoChartSize={ this.props.infoChartSize}
                isCollapsedFormGroup={this.props.isCollapsedFormGroup}
                variableChartParams={ chartTypeSelected }
                unitPrecipitazione = { this.props.unitPrecipitazione }
                format={ this.props.timeUnit }
            />);
    }
    getHeader = () => {
        return ( <span role="header" style={{ position: 'relative', zIndex: 1000, padding: "10px" }}>
            <span>Pannello Grafici - Latitudine: {parseFloat(this.props.infoChartData.latlng.lat.toFixed(5))}, Longitudine: {parseFloat(this.props.infoChartData.latlng.lng.toFixed(5))}</span>
            <button onClick={() => this.closePanel()} className="layer-settings-metadata-panel-close close">{this.props.closeGlyph ? <Glyphicon glyph={this.props.closeGlyph}/> : <span>×</span>}</button>
        </span>
        );
    }

    getPanelFormGroup = (showOneDatePicker) => {
        const tabSelected = this.getActiveTab();
        return (
            <div id="collapse-form-group">
                <InfoChartForm
                    tabList={this.props.tabList}
                    tabVariables={this.props.tabVariables}
                    onChangeChartVariable={this.props.onChangeChartVariable}
                    activeTab={tabSelected}
                    onChangeTab={this.props.onChangeTab}
                    activeRangeManager={this.props.activeRangeManager}
                    firstAvailableDate={this.props.firstAvailableDate}
                    lastAvailableDate={this.props.lastAvailableDate}
                    toData={this.props.toData}
                    periodType={this.props.periodType}
                    periodTypes={this.props.periodTypes}
                    onChangeFixedRangeTodata={this.props.onChangeFixedRangeTodata}
                    onChangePeriod={this.props.onChangePeriod}
                    infoChartSize={this.props.infoChartSize}
                    isOneDatePicker={false}
                    timeUnit={this.props.timeUnit}
                    fromData={this.props.fromData}
                    onChangeFromData={this.props.onChangeFromData}
                    onChangeToData={this.props.onChangeToData}
                    handleApplyPeriod={this.handleApplyPeriod}
                    variable={this.props.variable}
                    isInteractionDisabled={this.props.isInteractionDisabled}
                    onSetRangeManager={this.props.onSetRangeManager}
                    alertMessage={this.props.alertMessage}
                    toDataSelected={this.state.toDataSelected}
                    fromDataSelected={this.state.fromDataSelected}
                    handleChangeChartType={this.handleChangeChartType}
                    showOneDatePicker={showOneDatePicker}
                />
            </div>
        );
    }
    getBody = () => {
        const rotateIcon = this.props.isCollapsedFormGroup ? 'rotate(180deg)' : 'rotate(0deg)';
        const startPosition = getStartPositionPanel();
        const chartTypeSelected = this.getChartTypeSelected();
        return (
            <Dialog maskLoading={this.props.maskLoading} id={this.props.id}
                style={{
                    maxWidth: "100vw",
                    maxHeight: "100vh",
                    width: this.props.infoChartSize.widthResizable,
                    height: "fit-content"
                }}
                start={{ x: startPosition.x, y: startPosition.y}}
                className={this.props.panelClassName}>
                {this.getHeader()}
                <div role="body"
                    style={{
                        position: 'relative',
                        display: "flex",
                        flexDirection: "column",
                        width: '100%',
                        height: '100%'
                    }}>
                    <Resizable
                        width={this.props.infoChartSize.widthResizable}
                        height={this.props.infoChartSize.heightResizable}
                        onResize={this.onResize}
                        minConstraints={[400, 600]}
                        style={{
                            flexDirection: "column",
                            right: 17,
                            padding: "5px",
                            margin: "-15px 0px -10px 0px"
                        }}>
                        <div style={{ display: "flex", flexDirection: "column",
                            width: this.props.infoChartSize.widthResizable,  padding: '5px'}}>
                            <Button onClick={this.props.onCollapseRangePicker} style={{ padding: "2px", width: "80px"}} >
                                <Message msgId={this.props.isCollapsedFormGroup
                                    ? "gcapp.infochart.expand"
                                    : "gcapp.infochart.collapse"}  />
                                <span className="collapse-rangepicker-icon"  style={{ transform: rotateIcon }}>&#9650;</span>
                            </Button>
                            <Collapse in={!this.props.isCollapsedFormGroup}>
                                {this.getPanelFormGroup(chartTypeSelected.showOneDatePicker)}
                            </Collapse>
                            {!this.props.maskLoading && this.showChart(chartTypeSelected)}
                        </div>
                    </Resizable>
                </div>
            </Dialog>
        );
    }

    render() {
        return (
            this.props.show ? (
                <BorderLayout style={{zIndex: 1023}} children={this.getBody()}/>
            ) : null
        );
    }
    closePanel = () => {
        this.props.onSetInfoChartVisibility(false);
        this.props.onSetInfoChartDates(this.props.lastAvailableDate, DateAPI.getDefaultPeriod(this.props.periodTypes));
        this.props.onResetChartZoom();
        if ( this.props.infoChartSize.defaultWidth !== this.props.infoChartSize.widthResizable
            || this.props.infoChartSize.defaultHeight !== this.props.infoChartSize.heightResizable) {
            this.props.onResizeInfoChart(this.props.infoChartSize.defaultWidth, this.props.infoChartSize.defaultHeight);
        }
        this.initializeTabs();
        this.props.onHideMapinfoMarker({ id: MARKER_ID});
        if (this.props.alertMessage) {
            this.props.onCloseAlert();
        }
    }
    resetChartData = () => {
        if ( this.props.activeRangeManager === FIXED_RANGE) {
            // this.props.onChangePeriod(this.state.periodTypeSelected);
            this.props.onChangeFixedRangeTodata(this.props.infoChartData.toData);
        } else {
            this.props.onChangeToData(this.props.infoChartData.toData);
            this.props.onChangeFromData(this.props.infoChartData.fromData);
        }
    };
    validateDates = (fromDate, toDate, periodApplied) => {
        let fromDateToValidate = fromDate;
        if (!fromDateToValidate || isNaN(fromDateToValidate) || !(fromDateToValidate instanceof Date)) {
            this.props.onChangeFromData(this.props.infoChartData.fromData);
            return false;
        }
        if (!toDate || isNaN(toDate) || !(toDate instanceof Date)) {
            this.props.onChangeToData(this.props.infoChartData.toData);
            return false;
        }
        if ( this.props.activeRangeManager === FIXED_RANGE) {
            fromDateToValidate = moment(toDate).clone().subtract(periodApplied.max, 'days').toDate();
            // this.setState({ periodTypeSelected: periodApplied });
        }
        this.setState({ fromDataSelected: moment(fromDateToValidate).clone().format(this.props.timeUnit) });
        this.setState({ toDataSelected: moment(toDate).clone().format(this.props.timeUnit)  });
        const validation = DateAPI.validateDateRange(
            fromDateToValidate,
            toDate,
            this.props.firstAvailableDate,
            this.props.lastAvailableDate,
            this.props.timeUnit
        );
        if (!validation.isValid) {
            this.props.onOpenAlert("gcapp.infochart.errorMessages." + validation.errorMessage);
            this.resetChartData();
            return false;
        }
        return true;
    };
    handleApplyPeriod = (selectedVariables, idTabVariable, newPeriod) => {
        let periodApplied = newPeriod || this.props.periodType;
        let newFromData = this.props.fromData;
        let newToData = this.props.toData;
        // Date validations
        if (!this.validateDates(newFromData, newToData, periodApplied)) {
            return;
        }
        if ( this.props.activeRangeManager === FIXED_RANGE) {
            newFromData = moment(newToData).clone().subtract(periodApplied.max, 'days').toDate();
        } else {
            // set default period
            periodApplied = this.props.periodTypes.find(period => period.isDefault);
        }
        const variableIds = selectedVariables ? selectedVariables.map(variable => variable.id).join(',')
            : this.getActiveTab().variables.map(variable => variable.id).join(',');
        const idTab = idTabVariable || this.getActiveTab().id;
        // Clear alert message if validations pass
        if (this.props.alertMessage) {
            this.props.onCloseAlert();
        }
        // Ensure dates are in 'YYYY-MM-DD' format before making the fetch call
        this.props.onFetchInfoChartData({
            latlng: this.props.infoChartData.latlng,
            toData: moment(newToData).clone().format(this.props.timeUnit),
            fromData: moment(newFromData).clone().format(this.props.timeUnit),
            variables: variableIds,
            periodType: periodApplied,
            idTab: idTab
        });
        this.props.onResetChartZoom();
    }
}


export default InfoChart;
