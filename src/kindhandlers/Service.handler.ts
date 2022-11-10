import * as k8s from '@kubernetes/client-node';

import navSectionNames from '@constants/navSectionNames';

import {ResourceKindHandler} from '@models/resourcekindhandler';

import {createPodSelectorOutgoingRefMappers} from '@src/kindhandlers/common/outgoingRefMappers';

import {K8sResource} from '@monokle-desktop/shared';

const ServiceHandler: ResourceKindHandler = {
  kind: 'Service',
  apiVersionMatcher: '**',
  isNamespaced: true,
  navigatorPath: [navSectionNames.K8S_RESOURCES, navSectionNames.NETWORK, 'Services'],
  clusterApiVersion: 'v1',
  validationSchemaPrefix: 'io.k8s.api.core.v1',
  isCustom: false,
  getResourceFromCluster(kubeconfig: k8s.KubeConfig, resource: K8sResource): Promise<any> {
    const k8sCoreV1Api = kubeconfig.makeApiClient(k8s.CoreV1Api);
    return k8sCoreV1Api.readNamespacedService(resource.name, resource.namespace || 'default');
  },
  async listResourcesInCluster(kubeconfig: k8s.KubeConfig, {namespace}) {
    const k8sCoreV1Api = kubeconfig.makeApiClient(k8s.CoreV1Api);
    const response = namespace
      ? await k8sCoreV1Api.listNamespacedService(namespace)
      : await k8sCoreV1Api.listServiceForAllNamespaces();
    return response.body.items;
  },
  async deleteResourceInCluster(kubeconfig: k8s.KubeConfig, resource: K8sResource) {
    const k8sCoreV1Api = kubeconfig.makeApiClient(k8s.CoreV1Api);
    await k8sCoreV1Api.deleteNamespacedService(resource.name, resource.namespace || 'default');
  },
  outgoingRefMappers: createPodSelectorOutgoingRefMappers(),
  helpLink: 'https://kubernetes.io/docs/concepts/services-networking/service/',
};

export default ServiceHandler;
