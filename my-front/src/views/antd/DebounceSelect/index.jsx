import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Select, Spin } from 'antd';


const debounce = (fn, delay = 300) => {
    let timer = null;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
};

function DebounceSelect({ fetchOptions = () => [], showSearch = {}, debounceTimeout = 300, ...props }) {
    // console.log(fetchOptions);
    const [fetching, setFetching] = useState(false);
    const [options, setOptions] = useState([]);
    const fetchRef = useRef(0);
    const debounceFetcher = useMemo(() => {
        const loadOptions = value => {
            fetchRef.current += 1;
            const fetchId = fetchRef.current;
            setOptions([]);
            setFetching(true);
            // if (typeof fetchOptions?.then === 'function') {
            fetchOptions(value).then(newOptions => {
                if (fetchId !== fetchRef.current) {
                    // for fetch callback order
                    return;
                }
                setOptions(newOptions);
                setFetching(false);
            });
            /// }

        };
        return debounce(loadOptions, debounceTimeout);
    }, [fetchOptions, debounceTimeout]);

    useEffect(() => {
        if (props.options?.length) {
            setTimeout(() => setOptions(props.options), 0);
        }
    }, [])


    return (
        <Select
            showSearch={{ ...showSearch, onSearch: debounceFetcher }}
            notFoundContent={fetching ? <Spin size="small" /> : '未查到数据'}
            {...props}
            options={options}


        />
    );
}

const QuerySelect = (props) => {
    return (
        <DebounceSelect  {...props} />
    );
};
export default QuerySelect;