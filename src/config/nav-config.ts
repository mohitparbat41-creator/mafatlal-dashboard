import { NavGroup } from '@/types';

/**
 * Navigation configuration for MIL Business Snapshot
 *
 * Role-based visibility is handled in app-sidebar.tsx:
 * - 'sales' role: only sees items with url starting with /submit
 * - 'management' role: sees all items
 */
export const navGroups: NavGroup[] = [
  {
    label: 'Sales',
    items: [
      {
        title: 'Submit Snapshot',
        url: '/submit',
        icon: 'send',
        isActive: false,
        shortcut: ['s', 's'],
        items: []
      }
    ]
  },
  {
    label: 'Overview',
    items: [
      {
        title: 'Dashboard',
        url: '/dashboard/overview',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      },
      {
        title: 'Broadcast',
        url: '/dashboard/broadcast',
        icon: 'send',
        shortcut: ['b', 'b'],
        isActive: false,
        items: []
      },
      {
        title: 'Users',
        url: '/dashboard/users',
        icon: 'teams',
        shortcut: ['u', 'u'],
        isActive: false,
        items: []
      }
    ]
  },
  {
    label: '',
    items: [
      {
        title: 'Account',
        url: '#',
        icon: 'account',
        isActive: true,
        items: [
          {
            title: 'Profile',
            url: '/dashboard/profile',
            icon: 'profile',
            shortcut: ['m', 'm']
          },
          {
            title: 'Login',
            shortcut: ['l', 'l'],
            url: '/',
            icon: 'login'
          }
        ]
      }
    ]
  }
];
