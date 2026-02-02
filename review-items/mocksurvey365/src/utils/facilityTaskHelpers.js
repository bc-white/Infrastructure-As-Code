export const generateTaskKey = (title = "") => {
  return title
    .toLowerCase()
    .replace(/\s*\(.*?\)/g, "")
    .replace(/[^a-z0-9]/g, "")
    .substring(0, 20);
};

export const transformMandatoryTasks = (apiTasks = []) => {
  const transformed = {};

  apiTasks.forEach((task) => {
    const key = generateTaskKey(task.title || "");

    const probeList = {};
    const observationsList = {};

    task.categories?.forEach((category) => {
      const categoryKey = (category.name || "")
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[^a-z0-9]/g, "")
        .substring(0, 20);

      const questions = [];
      category.questions?.forEach((question) => {
        questions.push({
          probe: question.text || question.question,
          fTag:
            question.f_tag ||
            question.tag ||
            category.ftags?.[0] ||
            category.f_tags?.[0] ||
            "",
          citeOnYes: false,
        });
      });

      const observations = [];
      category.observations?.forEach((observation) => {
        observations.push({
          observation: observation,
          fTag: category.ftags?.[0] || category.f_tags?.[0] || "",
        });
      });

      if (questions.length > 0) {
        probeList[categoryKey] = {
          name: category.name,
          items: questions,
        };
      }

      if (observations.length > 0) {
        observationsList[categoryKey] = {
          name: category.name,
          items: observations,
        };
      }
    });

    const keyCheckpoints = task.categories?.map((cat) => cat.name) || [];

    transformed[key] = {
      name: (task.title || "").replace(/\s*\([^)]+\)/g, "").trim(),
      description: task.desc || task.source_citation || "",
      keyCheckpoints,
      isMandatory: true,
      showPathwayProbes: true,
      probeList,
      observationsList,
      source_citation: task.source_citation,
      version_date: task.version_date,
      _id: task._id,
    };
  });

  return transformed;
};

