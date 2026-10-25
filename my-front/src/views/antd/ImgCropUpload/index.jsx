import React, { useState } from 'react';
import { Upload, Image, Select } from 'antd';
import { buildDefaultFileList } from '@utils/utils';
import { FILE_BASEURI } from '@utils/const';
import ImgCrop from 'antd-img-crop';
import imgError from '@assets/imgerror.png';

const ImgCropUpload = ({ value, onChange = () => { }, placeholder = '上传头像', ImgCrop: ImgCropData = {}, ...props }) => {

    if (value == '' || value == undefined) {
        value = [];
    }

    if (value.length && Object.prototype.toString.call(value) === '[object String]') {
        value = buildDefaultFileList(FILE_BASEURI + value);
    }

    const [SelectVal, set_SelectVal] = useState(ImgCropData.aspect || '4 / 3');

    const [open, setOpen] = useState(false);
    const [previewURL, set_previewURL] = useState(null);


    const onPreview = file => {

        let src = file.url;
        if (file.originFileObj) {
            src = URL.createObjectURL(file.originFileObj)
        }
        setOpen(true);
        set_previewURL(src);

    };


    const handleChange = (val) => {
        // console.log(val);
        set_SelectVal(val)
    }
    return (
        <>
            <ImgCrop rotationSlider {...ImgCropData} aspect={eval(SelectVal)}>

                <Upload

                    listType="picture-card"
                    fileList={value}
                    onChange={({ fileList }) => onChange(fileList)}
                    onPreview={onPreview}
                    {...props}
                >
                    {value.length < 1 && <Select
                        placeholder='裁剪比例'
                        value={SelectVal}
                        onClick={(e) => e.stopPropagation()}
                        style={{ width: 120 }}
                        onChange={handleChange}
                        options={[
                            { value: '1 / 1', label: '1:1 同宽' },
                            { value: '4 / 3', label: '4:3 横幅' },
                            { value: '3 / 2', label: '3:2 横幅' },
                            { value: '16 / 9', label: '16:9 宽屏' },
                            { value: '21 / 9', label: '21:9 超宽' },
                            { value: '3 / 4', label: '3:4 竖幅' },
                            { value: '9 / 16', label: '9:16 竖屏' },
                            { value: '2 / 3', label: '2:3 竖版' },
                        ]}
                    />}
                </Upload>


            </ImgCrop>
            <Image style={{ display: 'none' }}
                src={previewURL}
                fallback={imgError}
                preview={{
                    open,
                    src: previewURL,
                    onOpenChange: value => setOpen(value)
                }}
            />
        </>
    );
};
export default ImgCropUpload;