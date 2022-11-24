import * as k8s from '@kubernetes/client-node';

import navSectionNames from '@constants/navSectionNames';

import {K8sResource} from '@shared/models/k8sResource';
import {ResourceKindHandler} from '@shared/models/resourceKindHandler';

const PersistentVolumeClaimHandler: ResourceKindHandler = {
  kind: 'PersistentVolumeClaim',
  apiVersionMatcher: '**',
  isNamespaced: true,
  navigatorPath: [navSectionNames.K8S_RESOURCES, navSectionNames.STORAGE, 'PersistentVolumeClaims'],
  clusterApiVersion: 'v1',
  validationSchemaPrefix: 'io.k8s.api.core.v1',
  isCustom: false,
  getResourceFromCluster(kubeconfig: k8s.KubeConfig, resource: K8sResource): Promise<any> {
    const k8sCoreV1Api = kubeconfig.makeApiClient(k8s.CoreV1Api);
    return k8sCoreV1Api.readNamespacedPersistentVolumeClaim(resource.name, resource.namespace || 'default', 'true');
  },
  async listResourcesInCluster(kubeconfig: k8s.KubeConfig, {namespace}) {
    const k8sCoreV1Api = kubeconfig.makeApiClient(k8s.CoreV1Api);
    const response = namespace
      ? await k8sCoreV1Api.listNamespacedPersistentVolumeClaim(namespace)
      : await k8sCoreV1Api.listPersistentVolumeClaimForAllNamespaces();
    return response.body.items;
  },
  async deleteResourceInCluster(kubeconfig: k8s.KubeConfig, resource: K8sResource) {
    const k8sCoreV1Api = kubeconfig.makeApiClient(k8s.CoreV1Api);
    await k8sCoreV1Api.deleteNamespacedPersistentVolumeClaim(resource.name, resource.namespace || 'default');
  },
  outgoingRefMappers: [
    {
      source: {
        pathParts: ['spec', 'volumeName'],
      },
      target: {
        kind: 'PersistentVolume',
      },
      type: 'name',
    },
  ],
  helpLink: 'https://kubernetes.io/docs/concepts/storage/persistent-volumes/#expanding-persistent-volumes-claims',
};

export default PersistentVolumeClaimHandler;
