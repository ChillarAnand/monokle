import * as k8s from '@kubernetes/client-node';

import log from 'loglevel';

import navSectionNames from '@constants/navSectionNames';

import {K8sResource} from '@models/k8sresource';
import {ResourceKindHandler} from '@models/resourcekindhandler';

import {targetGroupMatcher, targetKindMatcher} from '@src/kindhandlers/common/customMatchers';

import {clusterResourceWatcher} from '.';

const RoleBindingHandler: ResourceKindHandler = {
  kind: 'RoleBinding',
  apiVersionMatcher: '**',
  isNamespaced: true,
  navigatorPath: [navSectionNames.K8S_RESOURCES, navSectionNames.ACCESS_CONTROL, 'RoleBindings'],
  clusterApiVersion: 'rbac.authorization.k8s.io/v1',
  validationSchemaPrefix: 'io.k8s.api.rbac.v1',
  isCustom: false,
  getResourceFromCluster(kubeconfig: k8s.KubeConfig, resource: K8sResource): Promise<any> {
    const k8sRbacV1Api = kubeconfig.makeApiClient(k8s.RbacAuthorizationV1Api);
    return k8sRbacV1Api.readNamespacedRoleBinding(resource.name, resource.namespace || 'default');
  },
  async listResourcesInCluster(kubeconfig: k8s.KubeConfig, {namespace}) {
    const k8sRbacV1Api = kubeconfig.makeApiClient(k8s.RbacAuthorizationV1Api);
    const response = namespace
      ? await k8sRbacV1Api.listNamespacedRoleBinding(namespace)
      : await k8sRbacV1Api.listRoleBindingForAllNamespaces();
    return response.body.items;
  },
  async deleteResourceInCluster(kubeconfig: k8s.KubeConfig, resource: K8sResource) {
    const k8sRbacV1Api = kubeconfig.makeApiClient(k8s.RbacAuthorizationV1Api);
    await k8sRbacV1Api.deleteNamespacedRoleBinding(resource.name, resource.namespace || 'default');
  },
  outgoingRefMappers: [
    // see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.22/#roleref-v1-rbac-authorization-k8s-io
    {
      source: {
        pathParts: ['roleRef', 'name'],
        siblingMatchers: {
          kind: targetKindMatcher,
          apiGroup: targetGroupMatcher,
        },
      },
      target: {
        kind: '$.*',
      },
      type: 'name',
    },
    // see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.22/#subject-v1-rbac-authorization-k8s-io
    {
      source: {
        pathParts: ['subjects', '*', 'name'],
        siblingMatchers: {
          kind: (sourceResource: K8sResource, targetResource, value) => {
            return ['User', 'Group', 'ServiceAccount'].includes(value) && targetResource.kind === value;
          },
          apiGroup: (sourceResource: K8sResource, targetResource, value, siblingValues) => {
            const apiGroup =
              value || ['User', 'Group'].includes(siblingValues['kind']) ? 'rbac.authorization.k8s.io' : '';
            return targetResource.version.startsWith(apiGroup);
          },
          namespace: (sourceResource: K8sResource, targetResource, value, siblingValues) => {
            // namespace should not be specified for User/Group kinds
            if (['User', 'Group'].includes(siblingValues['kind'])) {
              return !value;
            }

            return value === 'default' || !value
              ? !targetResource.namespace ||
                  targetResource.namespace === 'default' ||
                  sourceResource.namespace === targetResource.namespace
              : targetResource.namespace === value;
          },
        },
      },
      target: {
        kind: '$(User|Group|ServiceAccount)',
      },
      type: 'name',

      // ignore refs to Users or Groups
      shouldCreateUnsatisfiedRef: (refMapper, sourceResource, values) => {
        const kind = values['kind'];
        return kind !== 'User' && kind !== 'Group';
      },
    },
  ],
  helpLink: 'https://kubernetes.io/docs/reference/access-authn-authz/rbac/#rolebinding-and-clusterrolebinding',
  watcherReq: undefined,
  disconnectFromCluster() {
    try {
      RoleBindingHandler.watcherReq.abort();
      RoleBindingHandler.watcherReq = undefined;
    } catch (e: any) {
      RoleBindingHandler.watcherReq = undefined;
      log.log(e.message);
    }
  },
  async watchResources(...args) {
    const requestPath: string = args[2]?.namespace
      ? `/apis/rbac.authorization.k8s.io/v1/namespaces/${args[2].namespace}/rolebindings`
      : `/apis/rbac.authorization.k8s.io/v1/rolebindings`;
    clusterResourceWatcher(RoleBindingHandler, requestPath, args[0], args[1], args[2], args[3]);
    return RoleBindingHandler.listResourcesInCluster(args[1], args[2], args[3]);
  },
};

export default RoleBindingHandler;
