// 渲染器除了要执行挂载之外，还需要执行更新动作
// 通过将渲染器设计为可配置的通用渲染器，即可实现渲染到任意目标平台上

interface RendererOptions {
    createElement(tag: string): any;
    insert(child: any, parent: any, anchor?: any): void;
    setElementText(el: any, text: string): void;
    patchProps(el: any, key: string, prevValue: any, nextValue: any): void;
}
interface VNode {
    type: string;
    props: any;
    children: any;
    _vnode?: VNode;
    el: any; // 关联真实 DOM 元素
}

export function createRenderer({
    createElement,
    insert,
    setElementText,
    patchProps,
} : RendererOptions) {
    // 挂载
    function mountElement(vnode: VNode, container: any) {
        // 创建元素
        const el = vnode.el = createElement(vnode.type);
        if (typeof vnode.children === 'string') {
            // 设置元素的文本节点
            setElementText(el, vnode.children);
        } else if (Array.isArray(vnode.children)) {
            // 遍历 children，创建元素，并插入到容器中
            vnode.children.forEach(child => {
                patch(null, child, el);
            });
        }

        if (vnode.props) {
            // 遍历 props，将属性设置到元素上
            for (const key in vnode.props) {
                patchProps(el, key, null, vnode.props[key]);
            }
        }
        // 插入到容器内
        insert(el, container);
    }

    /*
        更新
        n1 旧 vnode
        n2 新 vnode
    */
    function patchElement(n1, n2) {
        const el = n2.el = n1.el;
        const oldProps = n1.props || {};
        const newProps = n2.props || {};
        // 第一步更新属性
        for (const key in newProps) {
            if (newProps[key] !== oldProps[key]) {
                patchProps(el, key, oldProps[key], newProps[key]);
            }
        }
        for (const key in oldProps) {
            if (!(key in newProps)) {
                patchProps(el, key, oldProps[key], null);
            }
        }

        // 第二步更新 children
        patchChildren(n1, n2, el);
    }

    function patchChildren(n1, n2, container) {
        // 判断新子节点的类型是否是文本节点
        if (typeof n2.children === 'string') {
            // 旧子节点的类型有三种可能：没有子节点、文本子节点、一组子节点
            // 只有当旧子节点为一组子节点时，才需要逐个卸载，其他情况都不需要做
            if (Array.isArray(n1.children)) {
                n1.children.forEach(c => unmount(c));
            }
            // 设置文本节点
            setElementText(container, n2.children);
        }
        // 判断新子节点时一组子节点
        else if (Array.isArray(n2.children)) {
            // 判断旧子节点是否也是一组子节点
            if (Array.isArray(n1.children)) {
                // 新旧子节点都是一组子节点，这里涉及到 Diff 算法
                n1.children.forEach((c, i) => {
                    unmount(c);
                });
                n2.children.forEach((c, i) => {
                    patch(null, c, container);
                });
            } else {
                // 旧子节点要么是文本节点，要么不存在，我们都只需要将容器情况，然后将新的一组子节点逐个挂载
                setElementText(container, '');
                // 遍历新子节点，创建元素，并插入到容器中
                n2.children.forEach(child => {
                    patch(null, child, container);
                });
            }
        }
        // 子节点不存在
        else {
            // 旧子节点是一组子节点，新的子节点不存在
            if (Array.isArray(n1.children)) {
                n1.children.forEach(c => unmount(c));
            }
            // 旧子节点不存在，新的子节点是文本节点
            else if (typeof n1.children === 'string') {
                setElementText(container, '');
            }
        }
    }

    /*
        挂载、更新
        n1 旧 vnode
        n2 新 vnode
        container 容器
    */
    function patch(n1, n2, container) {
        // n1 存在，则对比 n1 和 n2 的类型
        if (n1 && n1.type !== n2.type) {
            // 如果两者类型不一致，则直接删除旧 vnode，创建新 vnode
            unmount(n1);
            n1 = null;
        }
        const {type} = n2;
        // 普通标签元素
        if (typeof type === 'string') {
            // n1 不存在，意味着是挂载
            if (!n1) {
                mountElement(n2, container);
            } else {
                // 更新
                patchElement(n1, n2);
            }
        }
        // 组件
        else if (typeof type === 'object') {
            // ......
        }
        else {
        }
    }
    // 卸载操作
    function unmount(vnode: VNode) {
        const parent = vnode.el.parentNode;
        parent && parent.removeChild(vnode.el);
    }
    // 渲染
    function render(vnode: VNode, container) {
        // 新的 vnode 存在，与旧的 vnode 一起传递给 patch 函数，进行打补丁
        if (vnode) {
            patch(container._vnode, vnode, container);
        } else {
            if (container._vnode) {
                // 旧的 vnode 存在，且新的 vnode 不存在，直接将 container 的子节点清空
                unmount(container._vnode);
            }
        }
        // 挂载时，将 vnode 存储到 container._vnode 下，这样下一次渲染时旧的 vnode 就存在了
        container._vnode = vnode;
    }
    return {
        render,
    };
}
