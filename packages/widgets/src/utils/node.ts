
export function findAncestor<T extends SceneNode>(
  node: SceneNode,
  predicate: (node: T) => boolean
): T | undefined {
  if (predicate(node as T)) {
    return node as T;
  }
  if (node.parent) {
    return findAncestor(node, predicate);
  }
}