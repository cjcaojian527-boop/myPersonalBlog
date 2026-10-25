import { Outlet } from 'react-router-dom';
import { useNavigate } from "react-router";
import React, { useEffect } from 'react';
import { Layout } from 'antd';
import './scss/home';
import HeaderComp from '@/components/Header';
import MenuComp from '@/components/Menu';
import TabsComp from '@/components/Tabs';
import { useMeunStore, useNav } from '@/store';
const { Header } = Layout;


const Home = () => {

    const collapsed = useMeunStore(state => state.collapsed);
    const navigate = useNavigate();

    useEffect(() => {
        useNav.getState().setNavigate(navigate);
    }, [navigate]);



    return (
        <Layout>
            <Header><HeaderComp /></Header>
            <div className='container'>
                <MenuComp />
                <div className='routerView' style={{ maxWidth: collapsed ? `calc(100vw - 85px)` : `calc(100vw - 256px)` }}>
                    <TabsComp className='TabsComp' />

                    <div className='view'><Outlet /></div>
                    {/* <p>Ant Design ©2026 Created by Ant UED</p> */}
                </div>
            </div>

        </Layout>)
};


export default Home;