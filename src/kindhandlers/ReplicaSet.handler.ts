import * as k8s from '@kubernetes/client-node';

import navSectionNames from '@constants/navSectionNames';

import {K8sResource} from '@shared/models/k8sResource';
import {ResourceKindHandler} from '@shared/models/resourceKindHandler';

import {PodOutgoingRefMappers} from './common/outgoingRefMappers';

const ReplicaSetHandler: ResourceKindHandler = {
  kind: 'ReplicaSet',
  apiVersionMatcher: '**',
  isNamespaced: true,
  navigatorPath: [navSectionNames.K8S_RESOURCES, navSectionNames.WORKLOADS, 'ReplicaSets'],
  clusterApiVersion: 'apps/v1',
  validationSchemaPrefix: 'io.k8s.api.apps.v1',
  isCustom: false,
  getResourceFromCluster(kubeconfig: k8s.KubeConfig, resource: K8sResource): Promise<any> {
    const k8sAppV1Api = kubeconfig.makeApiClient(k8s.AppsV1Api);
    return k8sAppV1Api.readNamespacedReplicaSet(resource.name, resource.namespace || 'default', 'true');
  },
  async listResourcesInCluster(kubeconfig: k8s.KubeConfig, {namespace}) {
    const k8sAppV1Api = kubeconfig.makeApiClient(k8s.AppsV1Api);
    const response = namespace
      ? await k8sAppV1Api.listNamespacedReplicaSet(namespace)
      : await k8sAppV1Api.listReplicaSetForAllNamespaces();
    return response.body.items;
  },
  async deleteResourceInCluster(kubeconfig: k8s.KubeConfig, resource: K8sResource) {
    const k8sAppV1Api = kubeconfig.makeApiClient(k8s.AppsV1Api);
    await k8sAppV1Api.deleteNamespacedReplicaSet(resource.name, resource.namespace || 'default');
  },
  outgoingRefMappers: [...PodOutgoingRefMappers],
  helpLink: 'https://kubernetes.io/docs/concepts/workloads/controllers/replicaset/',
};

export default ReplicaSetHandler;
