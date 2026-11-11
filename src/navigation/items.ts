export const navigationItems = [
  { id: 'timer', title: 'Timer', route: '/timer' },
  { id: 'clock', title: 'Clock', route: '/clock' },
  { id: 'calculator', title: 'Calculator', route: '/calculator' },
  { id: 'countdown', title: 'Countdown', route: '/countdown' },
  { id: 'worldClocks', title: 'World Clocks', route: '/world-clocks' },
  { id: 'home', title: 'Home', route: '/' },
] as const;

export type NavigationId = typeof navigationItems[number]['id'];
let dashboardFocus: NavigationId = 'timer';
export const getDashboardFocus = () => dashboardFocus;
export function rememberUtility(id: NavigationId) { if (id !== 'home') dashboardFocus = id; }

export function utilityForPath(path: string): NavigationId {
  if (path === '/custom') return 'timer';
  if (path === '/clock-ambient') return 'clock';
  return navigationItems.find((item) => item.route === path)?.id ?? 'home';
}
