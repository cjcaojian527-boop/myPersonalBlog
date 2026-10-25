import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'vite.config.js']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,           // 保留基础规则
      reactHooks.configs.flat.recommended, // 保留 Hooks 规则
      reactRefresh.configs.vite,        // 保留 Refresh 规则
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // ===== 关闭烦人规则 =====
      "no-unused-vars": "warn",              // 未使用变量改为警告
      "no-console": "off",                   // 允许 console
      "no-debugger": "warn",                 // debugger 改为警告
      // ===== 关闭 React 相关提示（不影响运行） =====
      "react-hooks/refs": "off",               // 关掉 render 期间访问 ref 的报错（Cannot access refs during render）
      "react-hooks/exhaustive-deps": "off",    // 依赖数组检查
      "react-refresh/only-export-components": "off", // 组件导出提示
      "no-empty": "off",                     // 允许空代码块
      "no-unused-expressions": "off",        // 三元表达式警告（a && b()）
      "react/prop-types": "off",             // 要求写 PropTypes
      "react/no-unescaped-entities": "off",  // JSX 中的引号等
      "no-prototype-builtins": "off",        // obj.hasOwnProperty() 警告
      "import/no-unresolved": "off",         // 路径找不到报错
      "no-case-declarations": "off",         // case 里声明变量报错
      "no-unreachable": "off",               // 允许不可达代码（调试用）
      "no-useless-assignment": "off",        // 允许无效赋值（调试用）

      // ===== 放松 JS 规则 =====
      "eqeqeq": "off",                      // 允许 == 比较
      "no-var": "off",                       // 允许 var 声明
      "prefer-const": "off",                 // 不强制使用 const
      "no-implicit-coercion": "off",         // 允许隐式类型转换（!!value）
      "no-shadow": "off",                    // 允许变量遮蔽
      "no-param-reassign": "off",            // 允许修改参数
      "no-return-assign": "off",             // 允许 return 赋值
      "no-plusplus": "off",                  // 允许 ++ 运算符
      "no-multi-assign": "off",              // 允许连续赋值（a = b = c）
      "prefer-template": "off",              // 不强制使用模板字符串
      "object-shorthand": "off",             // 不强制使用对象简写
      "no-nested-ternary": "off",            // 允许嵌套三元
      "no-mixed-operators": "off",           // 允许混合运算符
      "consistent-return": "off",            // 不强制函数返回一致
      "no-else-return": "off",               // 允许 else 中 return
    },
  },
])
