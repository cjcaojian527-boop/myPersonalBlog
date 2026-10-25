import React from 'react';
import { Button, Drawer } from 'antd';
import { formatTime } from '@utils/utils';
import '../scss/DrawerComp';



const DrawerComp = (_p = {}) => {

    const { open, onClose: handleClose, children = null, ...PROPS } = { ...defaultProps, ..._p };

    const onClose = (e) => {
        // console.log(e);
        if (e?.target?.closest?.('.ant-drawer-mask')) {
            // console.log('遮罩层点击，不关闭');
            return;
        }
        handleClose && handleClose(false);
    };

    return (
        <>

            <Drawer
                onClose={onClose}
                open={open}
                {...PROPS}
            >
                {children}
            </Drawer>
        </>
    );
};

const defaultProps = {
    title: "抽屉标题" + '_' + formatTime(new Date()),
    open: false,
    closable: { 'aria-label': 'Close Button' },
    // keyboard: false,
    placement: 'right',
    size: 400,
    destroyOnHidden: true,
    onClose: () => { },
}
export default DrawerComp;