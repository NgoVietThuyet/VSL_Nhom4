import { Injectable } from '@angular/core';

/** Port từ QLVB TreePlanUtil — build/collapse cây phương án. */
@Injectable({ providedIn: 'root' })
export class TreePlanUtil {
  buildTreeOptimaze(data: any[]): any[] {
    if (!data?.length) return [];

    const lookup = new Map<string, any>();
    const tree: any[] = [];

    data.forEach(item => {
      lookup.set(item.id, { ...item, key: item.id, children: [] });
    });

    data.forEach(item => {
      const node = lookup.get(item.id)!;
      if (item.pId && lookup.has(item.pId)) {
        const parent = lookup.get(item.pId)!;
        parent.children.push(node);
        node.parent = parent;
        node.expand = node.expand ?? false;
      } else {
        tree.push(node);
      }
    });

    return tree;
  }

  collapse(array: any[], data: any, expanded: boolean): void {
    if (!expanded && data.children) {
      data.children.forEach((d: any) => {
        const target = array.find(a => a.id === d.id);
        if (target) {
          target.expand = false;
          this.collapse(array, target, false);
        }
      });
    }
  }

  convertTreeToList(root: any): any[] {
    const stack: { node: any; level: number }[] = [{ node: root, level: 0 }];
    const array: any[] = [];
    const hashMap: Record<string, boolean> = {};

    while (stack.length) {
      const { node, level } = stack.pop()!;
      if (!hashMap[node.id]) {
        hashMap[node.id] = true;
        node.level = level;
        array.push(node);
      }
      if (node.children?.length) {
        for (let i = node.children.length - 1; i >= 0; i--) {
          stack.push({ node: node.children[i], level: level + 1 });
        }
      }
    }
    return array;
  }

  buildTreeQtgn(data: any[]): any[] {
      const tree: any[] = [];
      const lookup: { [id: string]: any } = {};

      data.forEach(item => {
          lookup[item.id] = {
              ...item,
              children: [],
              expand: true,
              iAllowExpand: false,
              parent: null
          };
      });

      data.forEach(item => {
          const node = lookup[item.id];
          if (item.pId && lookup[item.pId]) {
              const parent = lookup[item.pId];
              node.parent = parent;
              parent.children.push(node);
              parent.iAllowExpand = true;
          } else {
              tree.push(node);
          }
      });

      return tree;
  }
      collapseQtgn(array: any[], data: any, $event: boolean): void {
        const target = array.find(a => a.id === data.id);
        if (target && target.iAllowExpand) {
            target.expand = $event;

            if (!$event && target.children) {
                target.children.forEach((child: any) => {
                    const found = array.find(a => a.id === child.id);
                    if (found) {
                        found.expand = false;
                        this.collapseQtgn(array, found, false); // đệ quy đóng toàn bộ
                    }
                });
            }
        }
    }
  
  convertTreeToListQtgn(root: any): any[] {
      const stack: any[] = [];
      const array: any[] = [];
      const hashMap: { [id: string]: boolean } = {};

      root.level = 0;
      stack.push(root);

      while (stack.length > 0) {
          const node = stack.pop()!;
          if (!hashMap[node.id]) {
              array.push(node);
              hashMap[node.id] = true;
          }

          if (node.children && node.children.length > 0) {
              for (let i = node.children.length - 1; i >= 0; i--) {
                  const child = node.children[i];
                  child.level = node.level + 1;
                  child.parent = node;
                  stack.push(child);
              }
          }
      }

      return array;
  }
}
