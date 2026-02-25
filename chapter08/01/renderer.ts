// 渲染器除了要执行挂载之外，还需要执行更新动作
// 通过将渲染器设计为可配置的通用渲染器，即可实现渲染到任意目标平台上

interface RendererOptions {
    createElement(tag: string): any;
    insert(child: any, parent: any, anchor?: any): void;
    setElementText(el: any, text: string): void;
}
interface VNode {
    type: string;
    props: any;
    children: any;
    _vnode?: VNode;
}

export function createRenderer({
    createElement,
    insert,
    setElementText,
} : RendererOptions) {
    // 挂载
    function mountElement(vnode: {
        type: string;
        children: string;
    }, container) {
        // 创建元素
        const el = createElement(vnode.type);
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
                const value = vnode.props[key];
                el[key] = value;
            }
        }
        // 插入到容器内
        insert(el, container);
    }

    // 更新
    function patchElement(n1, n2, container) {
        // 暂先忽略
    }

    // 挂载、更新
    function patch(n1, n2, container) { 
        // n1 不存在，意味着是挂载
        if (!n1) {
            mountElement(n2, container);
        } else {
            // 更新
            patchElement(n1, n2, container);
        }
    }
    // 渲染
    function render(vnode: VNode, container) {
        // 新的 vnode 存在，与旧的 vnode 一起传递给 patch 函数，进行打补丁
        if (vnode) {
            patch(container._vnode, vnode, container);
        } else {
            if (container._vnode) {
                // 旧的 vnode 存在，且新的 vnode 不存在，直接将 container 的子节点清空
                container.innerHTML = '';
            }
        }
        // 挂载时，将 vnode 存储到 container._vnode 下，这样下一次渲染时旧的 vnode 就存在了
        container._vnode = vnode;
    }
    return {
        render,
    };
}
