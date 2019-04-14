"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@schematics/angular/utility/config");
const dependencies_1 = require("@schematics/angular/utility/dependencies");
const tasks_1 = require("@angular-devkit/schematics/tasks");
const path = require("path");
const project_1 = require("@schematics/angular/utility/project");
const schematics_1 = require("@angular-devkit/schematics");
const fs_1 = require("fs");
function default_1(options) {
    return (tree, _context) => {
        console.log("ngtron add! ", options.project);
        return schematics_1.chain([
            updateArchitect(options),
            addElectronMain(options),
            addPackageJsonDependencies(),
            installPackageJsonDependencies()
        ])(tree, _context);
    };
}
exports.default = default_1;
function updateArchitect(options) {
    return (tree, _context) => {
        const project = options.project;
        const workspace = config_1.getWorkspace(tree);
        const architect = workspace.projects[project].architect;
        if (!architect)
            throw new Error(`expected node projects/${project}/architect in angular.json`);
        architect["serve-electron"] = {
            builder: "@richapps/ngtron:serve",
            options: {
                browserTarget: project + ":serve",
                electronMain: "projects/" + project + "/electron.main.js"
            }
        };
        architect["build-electron"] = {
            builder: "./builders:build",
            options: {
                browserTarget: "app1:build",
                electronMain: "projects/" + project + "/electron.main.js",
                electronPackage: {
                    version: "0.0.0",
                    name: project,
                    main: "electron.main.js",
                    dependencies: {}
                },
                packagerConfig: {
                    mac: ["zip", "dmg"],
                    config: {
                        appId: "some.id",
                        npmRebuild: false,
                        asar: false,
                        directories: {
                            app: "dist/" + project,
                            output: "dist/" + project + "-electron",
                            buildResources: "projects/" + +"/electronResources"
                        },
                        electronVersion: "4.0.0"
                    }
                }
            }
        };
        return config_1.updateWorkspace(workspace);
    };
}
function addPackageJsonDependencies() {
    return (host, context) => {
        const dependencies = [
            { type: dependencies_1.NodeDependencyType.Dev, version: "~4.0.0", name: "electron" },
            {
                type: dependencies_1.NodeDependencyType.Dev,
                version: "13.1.1",
                name: "electron-packager"
            }
        ];
        dependencies.forEach(dependency => {
            dependencies_1.addPackageJsonDependency(host, dependency);
            context.logger.log("info", `✅️ Added "${dependency.name}" into ${dependency.type}`);
        });
        return host;
    };
}
function installPackageJsonDependencies() {
    return (host, context) => {
        context.addTask(new tasks_1.NodePackageInstallTask());
        context.logger.log("info", `🔍 Installing packages...`);
        return host;
    };
}
function addElectronMain(options) {
    return (tree, _context) => {
        // const project = options.project;
        // const workspace = getWorkspace(tree);
        const project = project_1.getProject(tree, options.project);
        console.log("Project ", project);
        // compensate for lacking sourceRoot property
        // e. g. when project was migrated to ng7, sourceRoot is lacking
        if (!project.sourceRoot && !project.root) {
            project.sourceRoot = "src";
        }
        else if (!project.sourceRoot) {
            project.sourceRoot = path.join(project.root, "src");
        }
        // TODO: If project is not main project (src !== ""),
        // use root instead of sourceRoot for tsconfig.modern.app.json
        // (the path of polyfills.modern.ts is fine)
        const tsConfigModernRootPath = project.root
            ? project.root
            : project.sourceRoot;
        const electronMain = fs_1.readFileSync(path.join(__dirname, "./files/electron.main.js"), {
            encoding: "utf-8"
        });
        const tsConfigModernPath = path.join(tsConfigModernRootPath, "electron.main.js");
        if (!tree.exists(tsConfigModernPath)) {
            tree.create(tsConfigModernPath, electronMain);
        }
        return tree;
    };
}
//# sourceMappingURL=index.js.map