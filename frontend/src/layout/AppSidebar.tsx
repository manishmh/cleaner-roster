"use client";
import Link from "next/link";
import React, { useCallback, useEffect, useRef, useState } from "react";
// import Image from "next/image";
import { useCalendarClient } from "@/components/calendar/CalendarClientContext";
import { useCalendarFilter } from "@/components/calendar/CalendarFilterContext";
import { teamApi, type Team } from "@/lib/api";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useStaff } from "../context/StaffContext";
import {
    // BoxCubeIcon,
    CalenderIcon,
    ChevronDownIcon,
    GridIcon,
    HorizontaLDots,
    // ListIcon,
    // PageIcon,
    // PieChartIcon,
    PlugInIcon,
    SearchIcon,
    TableIcon,
    UserCircleIcon,
} from "../icons/index";
// import SidebarWidget from "./SidebarWidget";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    subItems: [{ name: "Ecommerce", path: "/", pro: false }],
  },
  {
    icon: <UserCircleIcon />,
    name: "User Profile",
    path: "/profile",
  },

    // {
    //   name: "Forms",
    //   icon: <ListIcon />,
    //   subItems: [{ name: "Form Elements", path: "/form-elements", pro: false }],
    // },
  {
    name: "Tables",
    icon: <TableIcon />,
    subItems: [
      { name: "Cleaners Roster", path: "/cleaners-roster", pro: false },
      { name: "Staff Management", path: "/users", pro: false }
    ],
  },
  // {
  //   name: "Pages",
  //   icon: <PageIcon />,
  //   subItems: [
  //     { name: "Blank Page", path: "/blank", pro: false },
  //     { name: "404 Error", path: "/error-404", pro: false },
  //   ],
  // },
  {
    icon: <SearchIcon />,
    name: "Schedule",
    path: "/schedule/list-view",
  },
  // KEEP THE CALENDAR ITEM AT THE BOTTOM OF THE LIST
  {
    icon: <CalenderIcon />,
    name: "Calendar",
    path: "/calendar",
  },
];

const othersItems: NavItem[] = [
  // {
  //   icon: <PieChartIcon />,
  //   name: "Charts",
  //   subItems: [
  //     { name: "Line Chart", path: "/line-chart", pro: false },
  //     { name: "Bar Chart", path: "/bar-chart", pro: false },
  //   ],
  // },
  // {
  //   icon: <BoxCubeIcon />,
  //   name: "UI Elements",
  //   subItems: [
  //     { name: "Alerts", path: "/alerts", pro: false },
  //     { name: "Avatar", path: "/avatars", pro: false },
  //     { name: "Badge", path: "/badge", pro: false },
  //     { name: "Buttons", path: "/buttons", pro: false },
  //     { name: "Images", path: "/images", pro: false },
  //     { name: "Videos", path: "/videos", pro: false },
  //   ],
  // },
  {
    icon: <PlugInIcon />,
    name: "Authentication",
    subItems: [
      { name: "Sign In", path: "/signin", pro: false },
      { name: "Sign Up", path: "/signup", pro: false },
    ],
  },
];



const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();

  // --- Use CalendarFilterContext for sidebar filtering panel ---
  const {
    filterCategory,
    setFilterCategory,
    filterChecked,
    setFilterChecked,
  } = useCalendarFilter();
  const [filterSearch, setFilterSearch] = useState('');

  // Real data from backend
  const { staff: staffList, isLoading: isLoadingStaff } = useStaff();
  const [teamList, setTeamList] = useState<Team[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);

  const { clientList } = useCalendarClient();

  // Fetch teams data
  useEffect(() => {
    const fetchTeams = async () => {
      setIsLoadingTeams(true);
      try {
        const teamResponse = await teamApi.getAll();

        if (teamResponse.success && teamResponse.data) {
          setTeamList(teamResponse.data.data);
        }
      } catch (error) {
        console.error('Error fetching teams data:', error);
      } finally {
        setIsLoadingTeams(false);
      }
    };

    fetchTeams();
  }, []);

  // Get the list for the active category
  const getActiveList = () => {
    if (filterCategory === 'Staff') return staffList.filter(staff => staff.id != null).map(staff => ({ id: staff.id.toString(), name: staff.name }));
    if (filterCategory === 'Client') return clientList;
    return teamList.filter(team => team.id != null).map(team => ({ id: team.id.toString(), name: team.name }));
  };
  const filteredList = getActiveList().filter(item =>
    item.name.toLowerCase().includes(filterSearch.toLowerCase())
  );

  const handleCheckboxChange = (id: string) => {
    if (filterChecked.includes(id)) {
      setFilterChecked(filterChecked.filter(i => i !== id));
    } else {
      setFilterChecked([...filterChecked, id]);
    }
  };

  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "main" | "others"
  ) => (
    <ul className="flex flex-col gap-4">
      {navItems.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group  ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={` ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className={`menu-item-text`}>{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200  ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className={`menu-item-text`}>{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge `}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge `}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => path === pathname;
   const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    // Check if the current path matches any submenu item
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    // If no submenu item matches, close the open submenu
    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname,isActive]);

  useEffect(() => {
    // Set the height of the submenu items when the submenu is opened
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex  ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              {/* <Image
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Logo"
                width={150}
                height={40}
              />
              <Image
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={150}
                height={40}
              /> */}
            </>
          ) : (
            <>
            {/* <Image
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
              /> */}
              </>
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {/* Render main menu items */}
              {renderMenuItems(navItems, "main")}

              {/* Filtering Panel: Only show on /calendar route, under Calendar menu item */}
              {pathname === "/calendar" &&  (isExpanded || isHovered) && (
                <div className="mt-2 mb-4 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
                  {/* Category Toggle Buttons */}
                  <div className="grid grid-cols-2 gap-1 mb-2">
                    {[ 'Staff', 'Client', 'Team'].map(cat => (
                      <button
                        key={cat}
                        className={`flex-1 px-2 py-1.5 rounded text-xs font-medium border transition-colors duration-150
                          ${filterCategory === cat ? 'bg-blue-500 text-white border-blue-500' : 'bg-white dark:bg-gray-800 dark:text-blue-200 border-blue-200 dark:border-gray-700 hover:bg-blue-100 dark:hover:bg-gray-700'}`}
                        onClick={() => { setFilterCategory(cat as 'Staff' | 'Client'  | 'Team'); setFilterChecked([]); setFilterSearch(''); }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  {/* Search Input */}
                  <input
                    type="text"
                    className="w-full border border-gray-400 dark:border-gray-700 bg-white dark:bg-gray-800 rounded px-2 py-1.5 text-xs mb-2 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 text-gray-900 dark:text-gray-100"
                    placeholder="Search..."
                    value={filterSearch}
                    onChange={e => setFilterSearch(e.target.value)}
                  />
                  {/* Checkbox List */}
                  <div className="max-h-[370px] overflow-y-auto rounded p-2 bg-white dark:bg-gray-900">
                    {(isLoadingStaff || isLoadingTeams) && (
                      <div className="text-xs text-gray-400 dark:text-gray-500 py-2 text-center">Loading...</div>
                    )}
                    {!(isLoadingStaff || isLoadingTeams) && filteredList.length === 0 && (
                      <div className="text-xs text-gray-400 dark:text-gray-500 py-2 text-center">No results</div>
                    )}
                    {!(isLoadingStaff || isLoadingTeams) && filteredList.map(item => (
                      <label key={item.id} className="flex items-center gap-2 py-1 cursor-pointer text-sm text-gray-600 dark:text-gray-200">
                        <input
                          type="checkbox"
                          checked={filterChecked.includes(item.id.toString())}
                          onChange={() => handleCheckboxChange(item.id.toString())}
                          className="w-4 h-4 rounded"
                        />
                        <span>{item.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="">
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Others"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div>
          </div>
        </nav>
        {/* {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null} */}
      </div>
    </aside>
  );
};

export default AppSidebar;
