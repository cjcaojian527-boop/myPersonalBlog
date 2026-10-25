import React, { useState, useEffect } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { List, Checkbox, Button,Tag } from 'antd';
import { useContextList } from '@/pages/admin/models/Context';

import './index.scss';


const defaultPageData = {
    showSizeChanger: true,
    showQuickJumper: true,
    // onChange: (page, pageSize) => console.log(page, pageSize),
    pageSizeOptions: [5, 10, 20, 30, 50],
    showTotal: total => `共计：${total}`,
    size: "small",
    simple: { readOnly: true }
}



const SortableListItem = props => {


    const { itemKey, currentKey, RowClick, style, children, ...rest } = props;
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: itemKey,
    });
    const listStyle = {
        ...style,
        transform: CSS.Translate.toString(transform),
        transition,
        color: currentKey == itemKey ? '#fff' : '#000',
        cursor: 'pointer',
        // paddingLeft: 2,
        backgroundColor: currentKey == itemKey ? '#506efd' : '#fff',
     
        ...(isDragging ? { position: 'relative', zIndex: 9999 } : {}),
    };

    const list_div_style = {
        maxWidth: 300,              // ← 这个
        overflow: 'hidden',         // ← 隐藏溢出
        whiteSpace: 'nowrap',       // ← 不换行
        textOverflow: 'ellipsis',   // ← 省略号
    }




    return (
        <List.Item {...rest} ref={setNodeRef} style={listStyle} onClick={() => RowClick(itemKey)}>
            <div {...attributes} {...listeners} style={list_div_style}>
                {children}
            </div>
        </List.Item>
    );
};

const ListComp = ({ pageChange, listData: data = [], total: _total, RowClick: _RowClick,
     pagination:{current:{pageNum:current,pageSize}},openView = () => { }, deleteRow = () => { }, 
     set_listData: setData = () => { } }) => {

    const [currentKey, set_currentKey] = useState(-1);
    // const [pagination, setPagination] = useState({
    //     current: 1,
    //     pageSize: 10,
    // });
    const pagination={current,pageSize}

    // console.log('_pagination:',_pagination)
    const [checkedAll, set_checkedAll] = useState(false);
    const { setVale: setCheckbox } = useContextList.getState();
    const CheckboxMap = useContextList(state => state.CheckboxMap);
    const onChange = (current, pageSize) => {
        // console.log(current, pageSize);
        // setPagination({ ...pagination, current, pageSize })
        pageChange && pageChange(current, pageSize)
    }
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                // https://docs.dndkit.com/api-documentation/sensors/pointer#activation-constraints
                distance: 3,
            },
        }),
    );
    const onDragEnd = ({ active, over }) => {
        if (!active || !over) {
            return;
        }
        if (active.id !== over.id) {
            setData(prev => {
                const activeIndex = prev.findIndex(i => i.key === active.id);
                const overIndex = prev.findIndex(i => i.key === over.id);
                // console.log(arrayMove(prev, activeIndex, overIndex))
                return arrayMove(prev, activeIndex, overIndex);
            });
        }
    };


    const RowClick = (itemKey) => {
        // console.log(itemKey);
        if (itemKey === currentKey) return;
        set_currentKey(itemKey);
        _RowClick && _RowClick(data.find(f => f.id === itemKey), set_currentKey);
    }
    const CheckboxChange = (item, { target }) => {
        // console.log(item, target);
        setCheckbox("CheckboxMap", { ...CheckboxMap, [item.id]: target.checked });

    }

    const CheckboxAllChange = ({ target }) => {
        set_checkedAll(checked => {

            if (!checked) {
                const obj = Object.assign({}, ...data.map(m => ({ [m.id]: true })));
                setCheckbox("CheckboxMap", { ...CheckboxMap, ...obj });
            } else {
                setCheckbox("CheckboxMap", {});
            }
            return !checked;
        });
    }
    useEffect(() => {

        if (Object.keys(CheckboxMap).length == 0) {
            set_checkedAll(false);
        }

    }, [CheckboxMap])


    return (
        <DndContext
            sensors={sensors}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={onDragEnd}

            id="list-drag-sorting"
        >

            <SortableContext items={data.map((item, _inx) => item.key)} strategy={verticalListSortingStrategy}>
                <Checkbox checked={checkedAll} onChange={CheckboxAllChange}>{checkedAll ? '反选' : '全选'}</Checkbox>

                <Button onClick={deleteRow} disabled={!Object.keys(CheckboxMap).filter(key => CheckboxMap[key]).length} style={{ marginTop: 10 }} size='small' icon={<DeleteOutlined />}></Button>
                <Button onClick={openView} disabled={!Object.keys(CheckboxMap).filter(key => CheckboxMap[key]).length} style={{ marginTop: 10, marginLeft: 10 }} size='small' icon={<EyeOutlined />}></Button>
                <List
                    dataSource={data}
                    pagination={Object.assign(defaultPageData, pagination, { onChange, total: _total })}
                    renderItem={(item, i) => (
                        <SortableListItem key={item.key} itemKey={item.key} currentKey={currentKey} RowClick={RowClick}>
                            <span onClick={(e) => e.stopPropagation()}><Checkbox style={{ paddingLeft: 3 }} checked={!!CheckboxMap[item.id]} onChange={(value) => CheckboxChange(item, value)}></Checkbox></span> <Tag color='success'>顺序：{item.order}</Tag> <span> {item.label}</span>
                        </SortableListItem>
                    )}
                />
            </SortableContext>
        </DndContext>

    );
};
export default ListComp;