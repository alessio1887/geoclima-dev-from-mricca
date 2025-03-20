import React from 'react';

const TabBar = ({
    tabList,
    onChangeTab,
    activeTab
}) => {
    const selectedTab = activeTab || tabList[0]; // Usa il primo elemento di tabList se activeTab è null

    return (
        <div style={{
            display: 'flex',
            borderBottom: '1px solid #ccc',
            marginBottom: '10px',
            cursor: 'pointer'
        }}>
            {tabList.map(tab => (
                <div
                    key={tab.id}
                    style={{
                        padding: '10px 20px',
                        borderBottom: selectedTab?.id === tab.id ? '2px solid #007bff' : 'none',
                        color: selectedTab?.id === tab.id ? '#007bff' : '#000'
                    }}
                    onClick={() => onChangeTab(tab.id)}
                >
                    {tab.name}
                </div>
            ))}
        </div>
    );
};

export default TabBar;
