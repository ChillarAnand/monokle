import * as k8s from '@kubernetes/client-node';

import navSectionNames from '@constants/navSectionNames';

import {K8sResource} from '@models/k8sresource';
import {ResourceKindHandler} from '@models/resourcekindhandler';

import {clusterResourceWatcher} from '.';

const CustomResourceDefinitionHandler: ResourceKindHandler = {
  kind: 'CustomResourceDefinition',
  apiVersionMatcher: '**',
  isNamespaced: false,
  navigatorPath: [navSectionNames.K8S_RESOURCES, navSectionNames.CUSTOM, 'Definitions'],
  clusterApiVersion: 'apiextensions.k8s.io/v1',
  validationSchemaPrefix: 'io.k8s.apiextensions-apiserver.pkg.apis.apiextensions.v1',
  isCustom: false,
  getResourceFromCluster(kubeconfig: k8s.KubeConfig, resource: K8sResource): Promise<any> {
    const k8sExtensionsV1Api = kubeconfig.makeApiClient(k8s.ApiextensionsV1Api);
    return k8sExtensionsV1Api.readCustomResourceDefinition(resource.name);
  },
  async listResourcesInCluster(kubeconfig: k8s.KubeConfig) {
    const k8sExtensionsV1Api = kubeconfig.makeApiClient(k8s.ApiextensionsV1Api);
    const response = await k8sExtensionsV1Api.listCustomResourceDefinition();
    return response.body.items;
  },
  async deleteResourceInCluster(kubeconfig: k8s.KubeConfig, resource: K8sResource) {
    const k8sExtensionsV1Api = kubeconfig.makeApiClient(k8s.ApiextensionsV1Api);
    await k8sExtensionsV1Api.deleteCustomResourceDefinition(resource.name);
  },
  helpLink: 'https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/',
  watcherReq: undefined,
  disconnectFromCluster() {
    try {
      CustomResourceDefinitionHandler.watcherReq.abort();
      CustomResourceDefinitionHandler.watcherReq = undefined;
    } catch (e: any) {
      CustomResourceDefinitionHandler.watcherReq = undefined;
    }
  },
  async watchResources(...args) {
    const requestPath: string = `/apis/apiextensions.k8s.io/v1/customresourcedefinitions`;
    clusterResourceWatcher(CustomResourceDefinitionHandler, requestPath, args[0], args[1], args[2], args[3]);
    return CustomResourceDefinitionHandler.listResourcesInCluster(args[1], args[2], args[3]);
  },
};

export default CustomResourceDefinitionHandler;
