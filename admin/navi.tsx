import {
  NavigationContainer,
  ListNavItems,
  NavItem,
} from "@keystone-6/core/admin-ui/components";
import type { NavigationProps } from "@keystone-6/core/admin-ui/components";

export function Navi({ lists, authenticatedItem }: NavigationProps) {
  return (
    <NavigationContainer authenticatedItem={authenticatedItem}>
      <NavItem href="/">Dashboard</NavItem>
      <ListNavItems lists={lists} />
      <NavItem href="/add-blogs">Bulk Add Blog Urls</NavItem>
    </NavigationContainer>
  );
}
