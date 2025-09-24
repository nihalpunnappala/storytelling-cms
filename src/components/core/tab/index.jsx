import React, { useState, startTransition, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { InlineMenu, InlineMenuItem, PopIconMenuItem, PopMenuItem, Tab, TabContainer, TabContents, TabHeader, Title } from "./styles";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { GetIcon } from "../../../icons";
import { HLine } from "../dashboard/styles";
import ListTable from "../list/list";
import CrudForm from "../list/create";
import ImageGallery from "../list/imagegallery";
import { CustomPageTemplate } from "../list/custom";
import RenderSubPage from "../../project/router/pages";
import { getData } from "../../../backend/api";
import { DisplayInformations } from "../list/popup/displayinformations";

// Helper functions defined at the top level
const generateSlug = (text) => {
  return text
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
};

const findTabBySlug = (tabs, slug) => {
  return tabs?.find((tab) => generateSlug(tab.title) === slug);
};

const Tabs = ({ tabs: tabsData = [], className = "", popupMenu = "horizontal", editData, setMessage, setLoaderBox, openData, parentReference, parents, item, onTabChange = null, routingEnabled = false }) => {
  const { slug, mainTab: mainTabParam, subTab: subTabParam, inlineTab: inlineTabParam } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [t] = useTranslation();
  const themeColors = useSelector((state) => state.themeColors);
  // Declare tabs before any effect/hooks that reference it
  const [tabs, setTabs] = useState(tabsData);

  // Find tab and its parent hierarchy - defined before it's used
  const findTabHierarchy = (tabName, sourceTabsParam = null) => {
    const sourceTabs = sourceTabsParam ?? tabsData;
    if (!tabName) {
      return {
        activeTab: sourceTabs[0]?.name || null,
        subActiveTab: null,
        subActiveInlineTab: null,
        openedTab: {
          [sourceTabs[0]?.name]: true,
        },
        subMenus: sourceTabs[0]?.tabs || null,
      };
    }
    // Look in main tabs
    const mainTab = sourceTabs.find((tab) => tab.name === tabName);
    if (mainTab) return { mainTab };

    // Look in secondary tabs
    for (const main of sourceTabs) {
      if (!main.tabs) continue;
      const subTab = main.tabs.find((tab) => tab.name === tabName);
      if (subTab) return { mainTab: main, subTab };

      // Look in inline tabs
      for (const sub of main.tabs) {
        if (!sub.tabs) continue;
        const inlineTab = sub.tabs.find((tab) => tab.name === tabName);
        if (inlineTab) return { mainTab: main, subTab: sub, inlineTab };
      }
    }
    return {};
  };

  // Initialize state from URL or defaults
  const initializeState = (sourceTabs) => {
    const workingTabs = Array.isArray(sourceTabs) && sourceTabs.length > 0 ? sourceTabs : tabsData;
    let { mainTab, subTab, inlineTab } = findTabHierarchy(inlineTabParam || subTabParam || mainTabParam, workingTabs);

    // Fallback to first available tab if no match found
    if (!mainTab && workingTabs.length > 0) {
      mainTab = workingTabs[0];
      if (mainTab.tabs?.length > 0) {
        subTab = mainTab.tabs.find((tab) => tab.type !== "title");
        if (subTab?.tabs?.length > 0) {
          inlineTab = subTab.tabs.find((tab) => tab.type !== "title");
        }
      }
    } else if (mainTab && !subTab && mainTab.tabs?.length > 0) {
      subTab = mainTab.tabs.find((tab) => tab.type !== "title");
      if (subTab?.tabs?.length > 0) {
        inlineTab = subTab.tabs.find((tab) => tab.type !== "title");
      }
    }

    // Ensure we always have a valid state
    const activeTab = mainTab?.name || workingTabs[0]?.name || null;
    const subActiveTab = subTab?.name || null;
    const subActiveInlineTab = inlineTab?.name || null;

    const openedTab = {};
    if (activeTab) openedTab[activeTab] = true;
    if (subActiveTab) openedTab[subActiveTab] = true;
    if (subActiveInlineTab) openedTab[subActiveInlineTab] = true;

    return {
      activeTab,
      subActiveTab,
      subActiveInlineTab,
      openedTab,
      subMenus: mainTab?.tabs || workingTabs[0]?.tabs || null,
    };
  };

  const [state, setState] = useState(() => {
    if (!routingEnabled) {
      // If routing is disabled, just select the first tab
      const firstTab = tabsData[0];
      return {
        activeTab: firstTab?.name || null,
        subActiveTab: null,
        subActiveInlineTab: null,
        openedTab: { [firstTab?.name]: true },
        subMenus: firstTab?.tabs || null,
      };
    }
    return initializeState(tabsData);
  });

  useEffect(() => {
    if (routingEnabled) {
      try {
        setError(null);
        setIsLoading(true);
        const newState = initializeState(tabs);
        setState(newState);
      } catch (err) {
        console.error("Error initializing tab state:", err);
        setError("Failed to initialize tabs. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    }
  }, [mainTabParam, subTabParam, inlineTabParam, tabsData, routingEnabled, tabs]);

  // Prevent infinite re-renders
  useEffect(() => {
    if (tabsData && tabsData.length > 0 && !state.activeTab) {
      try {
        setState((prevState) => ({
          ...prevState,
          activeTab: tabsData[0]?.name || null,
          subMenus: tabsData[0]?.tabs || null,
          openedTab: { [tabsData[0]?.name]: true },
        }));
      } catch (err) {
        console.error("Error setting default tab:", err);
        setError("Failed to load default tab.");
      }
    }
  }, [tabsData, state.activeTab]);

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debug logging
  // console.log("Tab State:", {
  //   activeTab: state.activeTab,
  //   subActiveTab: state.subActiveTab,
  //   subActiveInlineTab: state.subActiveInlineTab,
  //   tabsData: tabsData.length,
  //   routingEnabled
  // });
  // Update state and URL atomically
  const updateState = (updates) => {
    setState((prev) => {
      const newState = { ...prev, ...updates };
      if (!routingEnabled) return newState;
      // Build the new path
      let path = `${location.pathname.split("/").slice(0, 3).join("/")}`; // Assumes base path is /entity/:slug
      if (newState.activeTab) path += `/${newState.activeTab}`;
      if (newState.subActiveTab) path += `/${newState.subActiveTab}`;
      if (newState.subActiveInlineTab) path += `/${newState.subActiveInlineTab}`;

      navigate(path, { replace: true });
      return newState;
    });
  };

  const mainTabChange = (tab) => {
    if (!tab || tab.name === state.activeTab || isTransitioning) return;

    setIsTransitioning(true);
    startTransition(() => {
      try {
        const { mainTab } = findTabHierarchy(tab.name, tabs);
        if (!mainTab) return;

        // Find first non-title sub tab
        let firstSubTab = null;
        if (mainTab.tabs?.length > 0) {
          firstSubTab = mainTab.tabs.find((tab) => tab.type !== "title");
        }

        // Update state atomically
        updateState({
          activeTab: mainTab.name,
          subActiveTab: firstSubTab?.name || null,
          subActiveInlineTab: null,
          openedTab: {
            [mainTab.name]: true,
            [firstSubTab?.name]: true,
          },
          subMenus: mainTab.tabs || null,
        });
      } finally {
        setIsTransitioning(false);
      }
    });
  };

  const subTabChange = async (tab) => {
    if (!tab || tab.name === state.subActiveTab || isTransitioning) return;

    setIsTransitioning(true);
    try {
      const { mainTab, subTab } = findTabHierarchy(tab.name, tabs);
      if (!mainTab || !subTab) return;

      // Handle dynamic tabs
      if (tab.dynamicTabs && (!tab.tabs || tab.tabs.length === 0)) {
        try {
          const response = await getData({ [parentReference]: openData?.data?._id }, tab.dynamicTabs.api);

          if (response.status === 200) {
            const newTabs =
              response.data?.map((itemMenu) => ({
                name: `${itemMenu.id}`,
                title: itemMenu.value,
                type: "subList",
                icon: "",
                css: "",
                element: {
                  ...tab.dynamicTabs.template,
                  params: {
                    ...tab.dynamicTabs.template.params,
                    shortName: itemMenu.value,
                    preFilter: {
                      ...tab.dynamicTabs.template.params.preFilter,
                      instance: itemMenu.id,
                    },
                  },
                },
                content: tab.dynamicTabs.template.content,
              })) || [];

            // Update tabs with dynamic content
            const updatedTab = { ...tab, tabs: newTabs };
            const updatedMainTabsList = mainTab.tabs.map((st) => (st.name === tab.name ? updatedTab : st));
            setTabs((prevTabs) =>
              prevTabs.map((t) =>
                t.name === mainTab.name
                  ? {
                      ...t,
                      tabs: updatedMainTabsList,
                    }
                  : t
              )
            );

            // Update state atomically with first dynamic tab and refreshed subMenus
            if (newTabs?.length > 0) {
              updateState({
                activeTab: mainTab.name,
                subActiveTab: updatedTab.name,
                subActiveInlineTab: newTabs[0].name,
                openedTab: {
                  [mainTab.name]: true,
                  [updatedTab.name]: true,
                  [newTabs[0].name]: true,
                },
                subMenus: updatedMainTabsList,
              });
              // Ensure current state reflects inline selection for the clicked sub tab
              setState((prev) => ({
                ...prev,
                subActiveTab: updatedTab.name,
                subActiveInlineTab: newTabs[0].name,
                openedTab: {
                  ...prev.openedTab,
                  [updatedTab.name]: true,
                  [newTabs[0].name]: true,
                },
                subMenus: updatedMainTabsList,
              }));
            }
          }
        } catch (error) {
          console.error("Error loading dynamic tabs:", error);
        }
      } else {
        // Find first inline tab if available
        const firstInlineTab = tab.tabs?.find((t) => t.type !== "title");

        // Update state atomically
        updateState({
          activeTab: mainTab.name,
          subActiveTab: subTab.name,
          subActiveInlineTab: firstInlineTab?.name || null,
          openedTab: {
            [mainTab.name]: true,
            [subTab.name]: true,
            ...(firstInlineTab ? { [firstInlineTab.name]: true } : {}),
          },
        });
      }
    } finally {
      setIsTransitioning(false);
    }
  };

  const subInlineTabChange = (tab) => {
    if (!tab || tab.name === state.subActiveInlineTab || isTransitioning) return;
    console.log({ tab });
    setIsTransitioning(true);
    try {
      const { mainTab, subTab, inlineTab } = findTabHierarchy(tab.name, tabs);
      if (mainTab && subTab && inlineTab) {
        updateState({
          activeTab: mainTab.name,
          subActiveTab: subTab.name,
          subActiveInlineTab: inlineTab.name,
          openedTab: {
            [mainTab.name]: true,
            [subTab.name]: true,
            [inlineTab.name]: true,
          },
        });
      }
    } finally {
      setIsTransitioning(false);
    }
  };

  const rederInlineMenu = (subTab, index) => {
    return (
      <InlineMenuItem
        key={`${subTab.name}-${index}`}
        theme={themeColors}
        className={`${subTab.name} ${state.subActiveInlineTab === subTab.name && "active"} ${popupMenu}`}
        onClick={() => {
          subInlineTabChange(subTab);
        }}
      >
        {subTab.icon && <GetIcon icon={subTab.icon}></GetIcon>}
        <span>{t(subTab.title ?? subTab.value)}</span>
      </InlineMenuItem>
    );
  };

  const renderPage = (tab, editData, setMessage, setLoaderBox, openData, parents) => {
    try {
      const { element, type, content, hasPermission } = tab;

      // Add fallback for missing element
      if (!element && type !== "jsx" && type !== "information") {
        console.warn(`Tab ${tab.name} has no element defined`);
        return (
          <div className="p-4 text-center text-gray-500">
            <p>No content available for this tab</p>
          </div>
        );
      }

      switch (type) {
        case "custom":
          return <CustomPageTemplate key={tab.name} openData={openData} {...element} themeColors={themeColors} setLoaderBox={setLoaderBox} setMessage={setMessage} content={content ?? RenderSubPage(tab.element, content)} />;

        case "information":
          return <CrudForm key={tab.name} {...editData} css="plain head-hide info" formTabTheme={tab.formTabTheme} noTabView={true} />;

        case "gallery":
          return <ImageGallery key={tab.name} showTitle={element.showTitle} imageSettings={element.imageSettings} api={`${element.api}`} openData={openData} />;

        case "edit":
          return <CrudForm key={tab.name} {...editData} css="plain head-hide info" />;

        case "details":
          return (
            <TabContainer className="tab">
              <DisplayInformations
                opentThem={content.opentTheme}
                editingHandler={(event) => {
                  event.stopPropagation();
                  content.isEditingHandler(openData?.data, content.udpateView, content.titleValue);
                }}
                titleValue={content.titleValue}
                popupMenu={popupMenu}
                formMode={content.formMode}
                style={content.style ?? "style1"}
                attributes={openData.attributes}
                data={openData.data}
              />
            </TabContainer>
          );

        case "jsx":
          return content;

        default:
          if (element?.attributes) {
            return (
              <ListTable
                hasPermission={hasPermission}
                name={tab.name}
                headerStyle={"sub"}
                icon={element.icon ?? ""}
                showInfo={element.showInfo ?? true}
                viewMode={element.viewMode ?? "table"}
                setMessage={setMessage}
                setLoaderBox={setLoaderBox}
                parentReference={element?.params?.parentReference}
                referenceId={openData?.data?._id}
                attributes={element.attributes}
                {...element.params}
                {...hasPermission?.permission}
                parents={{
                  ...parents,
                }}
              />
            );
          }
          return null;
      }
    } catch (error) {
      console.error(`Error rendering tab ${tab.name}:`, error);
      return (
        <div className="p-4 text-center text-red-500">
          <p>Error loading content for this tab</p>
          <p className="text-sm text-gray-500 mt-2">{error.message}</p>
        </div>
      );
    }
  };

  // Show error state
  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-500 mb-4">
          <h3 className="text-lg font-semibold">Something went wrong</h3>
          <p className="text-sm">{error}</p>
        </div>
        <button
          onClick={() => {
            setError(null);
            window.location.reload();
          }}
          className="px-4 py-2 bg-primary-base text-white rounded hover:bg-primary-dark"
        >
          Reload Page
        </button>
      </div>
    );
  }

  // Show loading state
  if (isLoading || isTransitioning) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-base mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  // Show empty state
  if (!tabs || tabs.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>No tabs available</p>
      </div>
    );
  }

  return (
    <TabContainer className={popupMenu}>
      {tabs.length > 0 && (
        <TabHeader className={`sub-menu ${className} ${popupMenu}`}>
          <HLine className={popupMenu}></HLine>
          {tabs.map((tab, index) => {
            return (
              <PopIconMenuItem
                key={`${tab.name}-${index}`}
                theme={themeColors}
                className={`${tab.name} ${state.activeTab === tab.name && "active"}  ${popupMenu}`}
                onClick={() => {
                  mainTabChange(tab);
                }}
              >
                {/* <pre>{JSON.stringify(tab.hasPermission  , null, 2)}</pre> */}
                <GetIcon icon={tab.icon}></GetIcon>
                {t(tab.title)}
              </PopIconMenuItem>
            );
          })}
        </TabHeader>
      )}
      {state.subMenus?.length > 0 && (
        <TabHeader className={`menu secondary-menu ${className} ${popupMenu}`}>
          {state.subMenus.map((tab, index) => {
            return tab.type === "title" ? (
              <Title key={`${tab.name}-title`} className="flex items-center gap-3">
                <span className="">{t(tab.title)}</span>
              </Title>
            ) : (
              <React.Fragment key={`${tab.name}-${index}`}>
                <PopMenuItem
                  key={`${tab.name}-${index}`}
                  theme={themeColors}
                  className={`${tab.tabs?.length > 0 ? "submenu" : ""} ${state.subActiveTab === tab.name ? "active" : ""} ${popupMenu}`}
                  onClick={async () => {
                    subTabChange(tab);
                  }}
                >
                  {tab.icon && <GetIcon icon={tab.icon} />}
                  {t(tab.title)} {tab?.length}
                </PopMenuItem>

                {tab.tabs?.length > 0 && tab.name === state.subActiveTab && <InlineMenu>{tab.tabs?.map((subTab, index) => rederInlineMenu(subTab, index))}</InlineMenu>}
              </React.Fragment>
            );
          })}
        </TabHeader>
      )}
      <TabContents className={`tab-page ${popupMenu} ${state.subMenus ? "sub-menu" : "menu"}`}>
        {tabs.map((tab, index) => {
          const isActive = state.subActiveTab === null && state.activeTab === tab.name;
          const shouldRender = state.openedTab[tab.name] === true || index === 0;

          return (
            <React.Fragment key={`${tab.name}-tab-content-${index}`}>
              <Tab className={`${className} ${popupMenu} ${tab.css ?? ""} tab-page`} theme={themeColors} active={isActive}>
                {shouldRender && (
                  <React.Suspense
                    fallback={
                      <div className="p-4 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-base mx-auto mb-2"></div>
                        <p className="text-sm text-gray-500">Loading...</p>
                      </div>
                    }
                  >
                    {renderPage(tab, editData, setMessage, setLoaderBox, openData, parents)}
                  </React.Suspense>
                )}
              </Tab>

              {tab.tabs?.map((subTab, index1) => {
                const isSubActive = state.subActiveInlineTab === null && state.subActiveTab === subTab.name;
                const shouldRenderSub = state.openedTab[subTab.name] === true || (state.openedTab[tab.name] === true && index1 === 0);

                return (
                  <React.Fragment key={`${subTab.name}-${index1}-tab-content`}>
                    <Tab className={`${className} ${popupMenu} ${subTab.css ?? ""} tab-page`} theme={themeColors} active={isSubActive}>
                      {shouldRenderSub && (
                        <React.Suspense
                          fallback={
                            <div className="p-4 text-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-base mx-auto mb-2"></div>
                              <p className="text-sm text-gray-500">Loading...</p>
                            </div>
                          }
                        >
                          {renderPage(subTab, editData, setMessage, setLoaderBox, openData, parents)}
                        </React.Suspense>
                      )}
                    </Tab>

                    {subTab.tabs?.map((subInlineTab, index2) => {
                      const isInlineActive = state.subActiveInlineTab === subInlineTab.name;
                      const shouldRenderInline = state.openedTab[subInlineTab.name] === true || (state.openedTab[subTab.name] === true && index2 === 0);

                      return (
                        <React.Fragment key={`${subInlineTab.name}-${index2}-sub-sub-tab-content`}>
                          <Tab className={`${className} ${popupMenu} ${subInlineTab.css ?? ""} tab-page`} theme={themeColors} active={isInlineActive}>
                            {shouldRenderInline && (
                              <React.Suspense
                                fallback={
                                  <div className="p-4 text-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-base mx-auto mb-2"></div>
                                    <p className="text-sm text-gray-500">Loading...</p>
                                  </div>
                                }
                              >
                                {renderPage(subInlineTab, editData, setMessage, setLoaderBox, openData, parents)}
                              </React.Suspense>
                            )}
                          </Tab>
                        </React.Fragment>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          );
        })}
      </TabContents>
    </TabContainer>
  );
};

export default Tabs;
