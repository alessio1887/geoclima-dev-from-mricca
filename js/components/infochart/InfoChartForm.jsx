/*
 * Copyright 2024, Riccardo Mari - CNR-Ibimet - Consorzio LaMMA.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
import React from 'react';
import { Button, ButtonGroup, Glyphicon, Panel, Grid, Label} from 'react-bootstrap';
import SelectVariableTab from '../buttons/SelectVariableTab';
import TabBar from '../buttons/TabBar';
import FixedRangeManager from '../../components/datepickers/FixedRangeManager';
import FreeRangeManager from '../../components/datepickers/FreeRangeManager';
import Message from '@mapstore/components/I18N/Message';
import moment from 'moment';
import momentLocaliser from 'react-widgets/lib/localizers/moment';
momentLocaliser(moment);
import { getChartActive, FIXED_RANGE, FREE_RANGE }  from '../../utils/VariabiliMeteoUtils';

const InfoChartForm = ({
    tabList,
    tabVariables,
    onChangeChartVariable,
    activeTab, // Riceve direttamente il valore di activeTab
    onChangeTab,
    activeRangeManager,
    showOneDatePicker,
    firstAvailableDate,
    lastAvailableDate,
    toData,
    periodType,
    periodTypes,
    onChangeFixedRangeTodata,
    onChangePeriod,
    infoChartSize,
    timeUnit,
    fromData,
    onChangeFromData,
    onChangeToData,
    handleApplyPeriod,
    variable,
    isInteractionDisabled,
    onSetRangeManager,
    alertMessage,
    toDataSelected,
    fromDataSelected,
    handleChangeChartType
}) => {
    const handleChangePeriod = (newPeriodType) => {
        onChangePeriod(newPeriodType);
        handleApplyPeriod(null, null, newPeriodType);
    };
    const handleChangeTab = (newIdTab) => {
        onChangeTab(newIdTab);
        handleApplyPeriod(tabVariables.find(tab => tab.id === newIdTab).variables, newIdTab, null);
    };
    const switchRangeManager = () => {
        const newRangeManager = activeRangeManager === FIXED_RANGE ? FREE_RANGE : FIXED_RANGE;
        onSetRangeManager(newRangeManager);
    };
    const updateSingleVariable = (selectedVariable, newIdTab) => {
        onChangeChartVariable(newIdTab, [selectedVariable]);
        const chartActive = getChartActive(activeTab);
        if (!chartActive.skipApplyPeriodOnChange ) {
            handleApplyPeriod([selectedVariable], newIdTab);
        }
    };
    const isTabBarVisible = () => {
        const isChartListOnActiveTab = activeTab.chartList && activeTab.chartList.length > 1;
        const isChartListInVariables = activeTab.variables[0].chartList && activeTab.variables[0].chartList.length > 1;

        return isChartListOnActiveTab || isChartListInVariables;
    };
    const rangepickerButtonFlexDirection = (!isTabBarVisible() || infoChartSize?.widthResizable > 460) ? 'row' : 'column';

    const chartList = activeTab?.variables[0]?.chartList || activeTab?.chartList || [];
    /**
     * Renders the date picker component based on the active range manager type.
     *
     * If `activeRangeManager` is FIXED_RANGE or `showOneDatePicker` is true,
     * it displays the FixedRangeManager component (showing only one date picker if showOneDatePicker is true).
     * Otherwise, it displays the FreeRangeManager component, allowing selection of both fromDate and toDate.
     */
    const renderDatesManager = () => {
        const commonProps = {
            minDate: firstAvailableDate,
            maxDate: lastAvailableDate,
            isInteractionDisabled,
            widthPanel: infoChartSize.widthResizable,
            format: timeUnit
        };

        if (activeRangeManager === FIXED_RANGE || showOneDatePicker) {
            return (
                <FixedRangeManager
                    {...commonProps}
                    toData={toData}
                    periodType={periodType}
                    periodTypes={periodTypes}
                    onChangeToData={onChangeFixedRangeTodata}
                    onChangePeriod={handleChangePeriod}
                    styleLabels="labels-infochart"
                    classAttribute="infochart-fixedrangemanager-action"
                    showOneDatePicker={showOneDatePicker}
                />
            );
        }

        return (
            <FreeRangeManager
                {...commonProps}
                fromData={fromData}
                toData={toData}
                onChangeFromData={onChangeFromData}
                onChangeToData={onChangeToData}
                styleLabels="labels-infochart"
                lablesType="gcapp.freeRangePicker"
                classAttribute="infochart-freerangemanager-action"
            />
        );
    };

    return (
        <Panel className="infochart-panel">
            <Grid fluid style={{ padding: 0 }}>
                <Label className="labels-infochart"><Message msgId="infochart.selectMeteoVariable" /></Label>
                <SelectVariableTab
                    idContainer="infochart-dropdown-container"
                    activeTab={activeTab}
                    tabList={tabList}
                    onChangeSingleVariable={updateSingleVariable}
                    onChangeMultiVariable={onChangeChartVariable}
                    onChangeTab={handleChangeTab}
                    isInteractionDisabled={false}
                />
                {renderDatesManager()}
                <div className="button-group-wrapper">
                    { isTabBarVisible() && (
                        <TabBar
                            tabList={chartList}
                            activeTab={chartList.find(chart => chart.active)}
                            onChangeTab={handleChangeChartType}
                            classAttribute={"chart-type"}
                        />
                    )}
                    <ButtonGroup className="rangepicker-button-container"
                        style={{
                            flexDirection: rangepickerButtonFlexDirection,
                            alignItems: 'flex-end',
                            marginLeft: 'auto',
                            gap: '10px',
                            top: (!isTabBarVisible() || infoChartSize?.widthResizable > 460) ? undefined : '10px'}}>
                        <Button className="rangepicker-button" onClick={() => handleApplyPeriod(variable)} disabled={isInteractionDisabled}
                            style={{ marginTop: (!isTabBarVisible() || infoChartSize?.widthResizable > 460) ? '20px' : undefined }}>
                            <Glyphicon glyph="calendar" /><Message msgId="gcapp.applyPeriodButton" />
                        </Button>
                        {!showOneDatePicker && <Button className="rangepicker-button" onClick={switchRangeManager} disabled={isInteractionDisabled}
                            style={{ marginTop: (!isTabBarVisible() || infoChartSize?.widthResizable > 460) ? '20px' : undefined }}>
                            <Message msgId={activeRangeManager === FIXED_RANGE
                                ? "gcapp.fixedRangePicker.dateRangeButton"
                                : "gcapp.freeRangePicker.dateRangeButton"} />
                        </Button>}
                    </ButtonGroup>
                </div>
                {alertMessage && (
                    <div className="alert-date" >
                        <strong><Message msgId="warning" /></strong>
                        <span><Message msgId={alertMessage}
                            msgParams={{
                                toData: toDataSelected,
                                fromData: fromDataSelected,
                                minDate: moment(firstAvailableDate).format(timeUnit),
                                maxDate: moment(lastAvailableDate).format(timeUnit)
                            }} /></span>
                    </div>
                )}
            </Grid>
        </Panel>
    );
};

InfoChartForm.defaultProps = {
    showOneDatePicker: false
};


export default InfoChartForm;
