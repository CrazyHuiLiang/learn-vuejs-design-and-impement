import {createRenderer} from './renderer.ts';

// 是否应该作为 DOM Properties 设置（还是作为 Attributes 设置）
function shouldSetAsProps(el, key, value) {
    // input 元素的 form 属性对应的 DOM Properties 是只读的，需要使用 setAttribute 来设置
    if (key === 'form' && el.tagName === 'INPUT') {
        return false;
    }
    return key in el;
}

// 将多种形式的 class 值转为 DOM Properties 的 className 属性
export function normalizeClass(value) {
    let res = '';
    if (typeof value === 'string') {
        res = value;
    } else if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
            const normalized = normalizeClass(value[i]);
            if (normalized) {
                res += normalized + ' ';
            }
        }
    } else if (Object.prototype.toString.call(value) === '[object Object]') {
        for (const name in value) {
            if (value[name]) {
                res += name + ' ';
            }
        }
    }
    return res.trim();
}

export const renderer = createRenderer({
    // 用于创建元素
    createElement(tag) {
        return document.createElement(tag);
    },
    // 用于设置元素的文本节点
    setElementText(el, text) {
        el.textContent = text;
    },
    // 用于在给定的 parent 下添加指定元素
    insert(el, container, anchor = null) {
        container.appendChild(el, anchor);
    },
    // 属性设置相关的操作
    patchProps(el, key, prevValue, nextValue) {
        // 匹配以 on 开头的属性，则将其作为事件处理程序处理
        if (/^on/.test(key)) {
            const invokers = el._vei || (el._vei = {});
            let invoker = invokers[key];
            const name = key.slice(2).toLowerCase();
            if (nextValue) {
                if (!invoker) {
                    invoker = el._vei[key] = (e) => {
                        // 如果事件发生的时间早于事件处理函数绑定的时间，则不执行事件处理函数
                        if (e.timeStamp < invoker.attached) return;
                        // 如果 invoker.value 是数组，则遍历它并逐个调用事件处理函数
                        if (Array.isArray(invoker.value)) {
                            invoker.value.forEach(fn => {
                                fn(e);
                            });
                        } else {
                            invoker.value(e);
                        }
                    }
                    invoker.value = nextValue;
                    // 添加 invoker.attached 属性，用于记录事件处理函数绑定的时间
                    invoker.attached = performance.now();
                    el.addEventListener(name, invoker);
                } else {
                    invoker.value = nextValue;
                }
            } else {
                el.removeEventListener(name, invoker);
            }
        } else if (key === 'class') {
            // 使用 className 性能比通过 setAttribute 和 el.classList 更好
            el.className = nextValue || '';
        } else if (shouldSetAsProps(el, key, nextValue)) {
            const type = typeof el[key];
            if (type === 'boolean' && nextValue === '') {
                el[key] = true;
            } else {
                el[key] = nextValue;
            }
        } else {
            el.setAttribute(key, nextValue);
        }
    }
});
