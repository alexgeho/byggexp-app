import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  taskService,
  projectService,
  userService,
  leaveService,
} from "../services";
import { getScheduleDemoData } from "../utils/scheduleDemo";

// Loads everything the schedule timeline renders — tasks, projects, workers
// and leaves — scoped to the current user's role, and refetches on focus.
// Returns the data plus a `reload` for callers that mutate (e.g. reschedule).
//
// `demo` short-circuits to the local demo dataset (dev only).
export const useScheduleData = (user, demo = false) => {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [leaves, setLeaves] = useState([]);

  const reload = useCallback(async () => {
    if (__DEV__ && demo) {
      const demoData = getScheduleDemoData();
      setTasks(demoData.tasks);
      setProjects(demoData.projects);
      setWorkers(demoData.workers);
      setLeaves(demoData.leaves || []);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const role = user?.role;
      const companyId = user?.companyId;

      const projectRequest =
        role === "superadmin"
          ? projectService.getAll()
          : role === "companyAdmin" && companyId
            ? projectService.getByCompany(companyId)
            : projectService.getMyProjects();

      // Company users (with names) so worker rows resolve to real names.
      const userRequest =
        role === "superadmin"
          ? userService.getAll()
          : userService.getMyCompanyUsers();

      const [taskData, projectData, workerData, leaveData] = await Promise.all([
        taskService.getAll().catch(() => []),
        projectRequest.catch(() => []),
        userRequest.catch(() => []),
        leaveService.getAll().catch(() => []),
      ]);

      setTasks(Array.isArray(taskData) ? taskData : []);
      setProjects(Array.isArray(projectData) ? projectData : []);
      setWorkers(Array.isArray(workerData) ? workerData : []);
      setLeaves(Array.isArray(leaveData) ? leaveData : []);
    } catch (error) {
      console.error("Failed to load schedule data:", error);
      setTasks([]);
      setProjects([]);
      setWorkers([]);
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  }, [user, demo]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return { loading, tasks, projects, workers, leaves, reload };
};
