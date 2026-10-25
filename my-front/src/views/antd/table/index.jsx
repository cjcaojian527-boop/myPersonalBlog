import React, { useState, useRef, useEffect } from 'react';
import { Table, Button, Space } from 'antd';
import '../scss/tableComp';
import { formatTime } from '@utils/utils';
import { initTable } from './table-utils';




const TableComp = (_p = {}) => {
    let { title, defaultPageData,
        columns: _columns, tableData: _tableData, pageChange,
        btns, rowBtns, CheckChange: _CheckChange, total: _total,
        rowHandClick, btnHandClick, rowSelection, ...PROPS } = { ...defaultProps, ..._p };



    const [columns, tableData] = initTable(_columns, _tableData, rowBtns, btnHandClick)
    const [selectedRowKey, setSelectedRowKey] = useState(null); // 高亮行的 key


    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
    });

    const [tableHeight, setTableHeight] = useState(400);
    const [tableWidth, setTableWidth] = useState(1200);

    const tableRef = useRef(null);


    // console.log('表格数据：', tableData);




    const onChange = (current, pageSize) => {
        // console.log(current, pageSize);
        setPagination({ ...pagination, current, pageSize })
        pageChange && pageChange(current, pageSize)
    }

    const CheckChange = (selectedRowKeys, selectedRows, { type }) => {
        // console.log(selectedRows);
        _CheckChange && _CheckChange(selectedRows)
    }

    const handleRow = (record, index) => {
        return {
            onContextMenu: (event) => { // 右键点击事件
                event.preventDefault(); // 阻止浏览器默认右键菜单
                // console.log('右键点击了行:', record);
                setSelectedRowKey(record.key); // 高亮当前行
                rowHandClick && rowHandClick(record, index, 2);
            },
            onClick: (event) => { // 可以同时监听左键点击
                // console.log('左键点击了行:', record);
                setSelectedRowKey(record.key); // 高亮当前行
                rowHandClick && rowHandClick(record, index, 1);
            },
        };

    }
    const containerRef = useRef(null);


    useEffect(() => {

        const updateHeight = () => {
            if (tableRef.current) {
                // 获取容器高度
                const height = tableRef.current.clientHeight - (55 + 32);
                const width = containerRef.current.clientWidth;
                setTableHeight(height);
                setTableWidth(width);
            }
        };

        updateHeight();

    }, []);


    return (
        <div className='table-contenier' ref={containerRef}>
            <div className='TITLE_TABLE'>
                <span className="title_lable" title={title}>{title}</span>
                <div>
                    {!!btns.length && <Space size="medium">{btns.map(({ text, action = '', ...btn }, i) => (<Button {...btn} onClick={() => btnHandClick({ btn, action }, 'top')} key={i + 1}>{text || 'testBtn'}</Button>))}</Space>}
                </div>
            </div>
            <Table
                className='custom-table'
                ref={tableRef}
                columns={columns}
                dataSource={tableData}
                // 用 initTable 生成的 key，而不是写死 id
                // —— 有些表主键不叫 id（如 Labels 表是 labelId），写死会导致每行 key 为 undefined
                rowKey="key"
                pagination={Object.assign(defaultPageData, pagination, { onChange, total: _total })}
                rowSelection={Object.assign(rowSelection, { onChange: CheckChange })}
                onRow={handleRow} // 绑定 onRow 事件
                rowClassName={(record) => record.key === selectedRowKey ? 'highlight-row' : ''}
                scroll={{ y: tableHeight }}
                {...PROPS}

            />
        </div>
    );
};



const defaultProps = {
    title: "表格标题" + '_' + formatTime(new Date()),
    columns: [],
    tableData: [],
    defaultPageData: {
        showSizeChanger: true,
        showQuickJumper: true,
        // onChange: (page, pageSize) => console.log(page, pageSize),
        pageSizeOptions: [5, 10, 20, 50, 100],
        showTotal: total => `总页数：${total}`
    },
    pageChange: () => { },
    CheckChange: () => { },
    rowHandClick: () => { },
    btnHandClick: () => { },
    btns: [],//[{ type: 'primary', size: 'small' }],
    rowBtns: [],
    bordered: true,
    loading: false,
    size: 'large',
    rowSelection: {
        align: 'center',
        type: 'checkbox',

    },
    total: 10,




}


export default TableComp;