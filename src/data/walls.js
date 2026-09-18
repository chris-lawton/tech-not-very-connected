/**
 * If you found this looking for the answers: nobody likes a cheater.
 * Yes, we can see you in the Network tab. Close it and go and think.
 *
 * Game content. Edit freely.
 * Each wall needs exactly 4 categories with exactly 4 items each.
 * `colour` is 1-4 and only picks a solved-group style.
 */
export const WALLS = [
  {
    id: 'easy',
    name: 'Easy',
    categories: [
      {
        id: 'easy-git',
        name: 'Git commands',
        colour: 1,
        items: ['commit', 'rebase', 'stash', 'clone']
      },
      {
        id: 'easy-http',
        name: 'HTTP methods',
        colour: 2,
        items: ['PUT', 'PATCH', 'DELETE', 'OPTIONS']
      },
      {
        id: 'easy-display',
        name: 'CSS display values',
        colour: 3,
        items: ['flex', 'grid', 'inline-block', 'table']
      },
      {
        id: 'easy-browsers',
        name: 'Web browsers',
        colour: 4,
        items: ['Chrome', 'Safari', 'Firefox', 'Edge']
      }
    ]
  },
  {
    id: 'medium',
    name: 'Medium',
    categories: [
      {
        id: 'medium-web',
        name: 'Follows "web"',
        colour: 1,
        items: ['socket', 'pack', 'hook', 'assembly']
      },
      {
        id: 'medium-django',
        name: 'Django concepts',
        colour: 2,
        items: ['middleware', 'migration', 'signal', 'queryset']
      },
      {
        id: 'medium-wagtail',
        name: 'Wagtail concepts',
        colour: 3,
        items: ['StreamField', 'snippet', 'workflow', 'revision']
      },
      {
        id: 'medium-a11y',
        name: 'Accessibility terminology',
        colour: 4,
        items: ['landmark', 'focus', 'label', 'region']
      }
    ]
  },
  {
    id: 'hard',
    name: 'Hard',
    categories: [
      {
        id: 'hard-git',
        name: 'Git terms',
        colour: 1,
        items: ['head', 'main', 'index', 'tag']
      },
      {
        id: 'hard-react',
        name: 'React terms',
        colour: 2,
        items: ['state', 'effect', 'ref', 'key']
      },
      {
        id: 'hard-html',
        name: 'HTML terms',
        colour: 3,
        items: ['body', 'link', 'fragment', 'template']
      },
      {
        id: 'hard-array',
        name: 'JavaScript array methods',
        colour: 4,
        items: ['map', 'filter', 'push', 'flat']
      }
    ]
  }
];

export const WALL_IDS = WALLS.map((wall) => wall.id);

export function getWall(id) {
  return WALLS.find((wall) => wall.id === id);
}

export function getCategory(wallId, categoryId) {
  return getWall(wallId).categories.find((category) => category.id === categoryId);
}

export function allItems(wallId) {
  return getWall(wallId).categories.flatMap((category) => category.items);
}
