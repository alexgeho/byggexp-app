import { useContext, useEffect, useMemo, useState } from "react";
import Constants from "expo-constants";
import * as Updates from "expo-updates";
import AuthContext from "../contexts/AuthContext";
import { companyService, projectService } from "../services";

export const NOT_AVAILABLE = "N/A";

// App version comes from the native binary (app.json version), the OTA line
// identifies the JS bundle actually running: its channel plus a short update id
// ("embedded" when running the bundle shipped inside the build, i.e. no OTA
// applied). This is how you tell a phone picked up an `eas update` vs still
// running the build's original code.
const APP_VERSION =
  Constants.expoConfig?.version || Constants.manifest?.version || "—";
const OTA_CHANNEL = Updates.channel || "—";
const OTA_UPDATE_ID = Updates.updateId
  ? Updates.updateId.slice(0, 8)
  : "embedded";

const getFirstDefinedValue = (...values) =>
  values.find((value) => typeof value === "string" && value.trim()) || "";

const formatPhone = (source) => {
  const phone = getFirstDefinedValue(
    source?.phone,
    source?.phoneNumber,
    source?.contactPhone,
  );

  if (phone) {
    const areaCode = source?.phoneAreaCode ? `+${source.phoneAreaCode} ` : "";
    return `${areaCode}${phone}`.trim();
  }

  return "";
};

const buildContactValue = (project, company) => {
  const values = [
    getFirstDefinedValue(
      company?.email,
      company?.contactEmail,
      project?.contactEmail,
    ),
    getFirstDefinedValue(
      company?.website,
      company?.site,
      company?.url,
      project?.website,
    ),
    formatPhone(company) || formatPhone(project),
  ].filter(Boolean);

  return values.length ? values.join(" / ") : NOT_AVAILABLE;
};

const getProjectCompanyId = (project) =>
  project?.clientCompanyId ||
  project?.clientCompany?._id ||
  project?.clientCompany?.id ||
  project?.companyId ||
  project?.company?._id ||
  project?.company?.id ||
  null;

export function useAppInformation() {
  const { user, selectedProject } = useContext(AuthContext);
  const [appInfo, setAppInfo] = useState({
    developer: NOT_AVAILABLE,
    contact: NOT_AVAILABLE,
  });
  const [loadingInfo, setLoadingInfo] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadAppInfo = async () => {
      if (user?.role === "superadmin") {
        if (isMounted) {
          setAppInfo({
            developer: NOT_AVAILABLE,
            contact: NOT_AVAILABLE,
          });
        }
        return;
      }

      try {
        setLoadingInfo(true);

        let relevantProject = selectedProject || null;
        let companyId = getProjectCompanyId(relevantProject);

        if (relevantProject && !companyId) {
          const projectId = relevantProject?._id || relevantProject?.id;
          if (projectId) {
            relevantProject = await projectService.getById(projectId);
            companyId = getProjectCompanyId(relevantProject);
          }
        }

        if (!relevantProject || !companyId) {
          const projects = await projectService.getMyProjects();
          const fallbackProject = Array.isArray(projects)
            ? projects[0] || null
            : null;

          if (fallbackProject) {
            relevantProject = fallbackProject;
            companyId = getProjectCompanyId(fallbackProject);
          }
        }

        if (!relevantProject) {
          if (isMounted) {
            setAppInfo({
              developer: NOT_AVAILABLE,
              contact: NOT_AVAILABLE,
            });
          }
          return;
        }

        const company = companyId
          ? await companyService.getById(companyId)
          : null;
        const developer = getFirstDefinedValue(
          company?.name,
          company?.companyName,
          relevantProject?.clientCompany?.name,
          relevantProject?.company?.name,
        );

        if (isMounted) {
          setAppInfo({
            developer: developer || NOT_AVAILABLE,
            contact: buildContactValue(relevantProject, company),
          });
        }
      } catch (error) {
        console.error("Failed to load app info:", error);

        if (isMounted) {
          setAppInfo({
            developer: NOT_AVAILABLE,
            contact: NOT_AVAILABLE,
          });
        }
      } finally {
        if (isMounted) {
          setLoadingInfo(false);
        }
      }
    };

    loadAppInfo();

    return () => {
      isMounted = false;
    };
  }, [selectedProject, user?.role]);

  const appInformationRows = useMemo(
    () => [
      { key: "version", label: "Version", value: APP_VERSION },
      {
        key: "build",
        label: "Build",
        value: `${OTA_CHANNEL} · ${OTA_UPDATE_ID}`,
      },
      { key: "developer", label: "Developer", value: appInfo.developer },
      { key: "contact", label: "Contact", value: appInfo.contact },
    ],
    [appInfo.contact, appInfo.developer],
  );

  return {
    appInfo,
    appInformationRows,
    loadingInfo,
  };
}
