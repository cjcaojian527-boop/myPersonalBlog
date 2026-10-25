import SyntaxHighlighter from 'react-syntax-highlighter';
import { darcula } from 'react-syntax-highlighter/dist/esm/styles/hljs'; // 引入样式主题

const CodeBlock = ({ codeString = '' }) => {

    return (

        <SyntaxHighlighter
            language="javascript"
            style={darcula}
            showLineNumbers={true} // 开启行号显示
        >
            {codeString}
        </SyntaxHighlighter>
    );
};

export default CodeBlock;