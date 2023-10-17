import * as k8s from '@kubernetes/client-node';

import navSectionNames from '@constants/navSectionNames';

import {ResourceMeta} from '@shared/models/k8sResource';
import {ResourceKindHandler} from '@shared/models/resourceKindHandler';

const ValidatingAdmissionPolicyHandler: ResourceKindHandler = {
  kind: 'ValidatingAdmissionPolicy',
  apiVersionMatcher: '**',
  isNamespaced: false,
  navigatorPath: [navSectionNames.K8S_RESOURCES, navSectionNames.CONFIGURATION, 'ValidatingAdmissionPolicies'],
  clusterApiVersion: 'admissionregistration.k8s.io/v1alpha1',
  validationSchemaPrefix: 'io.k8s.api.admissionregistration.v1alpha1',
  isCustom: false,
  getResourceFromCluster(kubeconfig: k8s.KubeConfig, resource: ResourceMeta) {
    const k8sAdmissionregistrationV1alpha1Api = kubeconfig.makeApiClient(k8s.AdmissionregistrationV1alpha1Api);
    k8sAdmissionregistrationV1alpha1Api.setDefaultAuthentication(new k8s.VoidAuth());
    return k8sAdmissionregistrationV1alpha1Api.readValidatingAdmissionPolicy(resource.name);
  },
  async listResourcesInCluster(kubeconfig: k8s.KubeConfig) {
    const k8sAdmissionregistrationV1alpha1Api = kubeconfig.makeApiClient(k8s.AdmissionregistrationV1alpha1Api);
    k8sAdmissionregistrationV1alpha1Api.setDefaultAuthentication(new k8s.VoidAuth());
    const response = await k8sAdmissionregistrationV1alpha1Api.listValidatingAdmissionPolicy();
    return response.body.items || [];
  },
  async deleteResourceInCluster(kubeconfig: k8s.KubeConfig, resource: ResourceMeta) {
    const k8sAdmissionregistrationV1alpha1Api = kubeconfig.makeApiClient(k8s.AdmissionregistrationV1alpha1Api);
    k8sAdmissionregistrationV1alpha1Api.setDefaultAuthentication(new k8s.VoidAuth());
    await k8sAdmissionregistrationV1alpha1Api.deleteValidatingAdmissionPolicy(resource.name);
  },
  helpLink: 'https://kubernetes.io/docs/reference/access-authn-authz/validating-admission-policy/',
};

export default ValidatingAdmissionPolicyHandler;
