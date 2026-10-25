import React, { useState, useEffect } from 'react';
import { Menu, Button } from 'antd';
import {
    MenuUnfoldOutlined, MenuFoldOutlined, FileTextOutlined,
    CodeSandboxCircleFilled, PartitionOutlined, BankOutlined, BookOutlined,SnippetsOutlined,
    ProductOutlined, DesktopOutlined, HomeOutlined, UserOutlined,PaperClipOutlined,MessageOutlined
} from '@ant-design/icons';
import { useMeunStore, useTabsStore } from '@/store';
import { useNavigate } from 'react-router-dom';
import { suorceMenus } from '@/router';

export const iconMap = {
    MenuUnfoldOutlined, MenuFoldOutlined, FileTextOutlined, ProductOutlined, PartitionOutlined, BankOutlined,MessageOutlined,
    DesktopOutlined, HomeOutlined, UserOutlined, CodeSandboxCircleFilled, BookOutlined,SnippetsOutlined,PaperClipOutlined
};


export default function MenuComp() {

    const { items: Menus, setVale: setMeunVale } = useMeunStore.getState();
    const collapsed = useMeunStore(state => state.collapsed);
    const { addTabs, setVale } = useTabsStore.getState();
    const currentKey = useTabsStore(state => state.currentTab);
    const navigate = useNavigate();




    const _transformMenus = (list) => {

        const arr = list.map(({ pid, ...m }) => {
            const item = {
                ...m
            }
            if (item.children.length) {
                item.children = _transformMenus(item.children)
            } else {
                delete item.children;
            }

            if (!!item.icon && iconMap[item.icon] !== undefined) {
                const Icon = iconMap[item.icon];
                item.icon = <Icon />;
            } else {
                delete item.icon;
            }
            return item;
        });
        return arr;
    }

    const items = _transformMenus(Menus)
    // 




    const toggleCollapsed = () => {
        setMeunVale("collapsed", !collapsed);
    }


    // 用 key 反查菜单，不再读 item.props
    // （antd 已弃用 onClick 回调里的 item —— 未来不再提供 React 元素实例）
    const onClick = ({ key }) => {
        try {
            const tab = suorceMenus.find(f => f.id + '' === key);
            if (!tab) return;

            const isShouye = tab.absolutePath === '/admin/index';//是否首页
            const tabKey = tab.id + '';
            addTabs({
                label: tab.label,
                key: tabKey,
                closable: !isShouye,
                routepath: tab.absolutePath,
            });
            setVale("currentTab", tabKey);
            navigate(tab.absolutePath + '?_menu' + Date.now());
        } catch (error) {
            console.warn(error);
        }
    }

    useEffect(() => {
        addTabs({
            label: '首页',
            key: suorceMenus.find(f => f.absolutePath === '/admin/index')?.id + '',
            closable: false,
            routepath: '/admin/index'
        });
        // console.log(suorceMenus)
        // console.log("currentKey:", currentKey, items)
    }, []);



    return (<div style={{ width: collapsed ? 85 : 256, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

        <Menu
            mode="inline"
            inlineCollapsed={collapsed}
            defaultOpenKeys={['1','2']}
            selectedKeys={[currentKey]}
            style={{ width: '100%', flex: 1 }}
            items={items}
            onClick={onClick}
        />
        <Button type="dashed" style={{ width: '100%' }} onClick={toggleCollapsed}> {collapsed ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}</Button>
    </div>)

}