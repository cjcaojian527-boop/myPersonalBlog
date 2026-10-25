import { Tabs } from 'antd';
// import React, { useRef, useState, useEffect } from 'react';
import { useTabsStore } from '@/store';
import { useNavigate } from 'react-router-dom';




const TabsComp = () => {
    const navigate = useNavigate();
    const initialItems = useTabsStore(state => state.Tabs);
    const activeKey = useTabsStore(state => state.currentTab);
    const { setVale: setActiveKey, deleteTabs } = useTabsStore.getState();
    // console.log("Tabs:", initialItems, "currentTab:", activeKey)


    const onChange = newActiveKey => {

        setActiveKey("currentTab", newActiveKey);
        const tab = initialItems.find(f => f.key === newActiveKey);
        if (tab?.routepath) {
            navigate(tab.routepath + '?_tab' + Date.now(), { replace: true });
        }
    };

    const onEdit = (targetKey, action) => {
        if (action === 'add') {
            // add();
        } else {
            deleteTabs(targetKey, path => navigate(path + '?_tab' + Date.now(), { replace: true }));

        }
    };



    return (
        <Tabs
            type="editable-card"
            hideAdd
            onChange={onChange}
            size='small'
            tabBarGutter={4}
            activeKey={activeKey}
            onEdit={onEdit}
            items={initialItems}
        />)

}
export default TabsComp;