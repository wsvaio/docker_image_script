import { execSync } from "node:child_process";
import { NodeSSH } from "node-ssh";

const textDecoder = new TextDecoder();
const $ = (command: string) => textDecoder.decode(execSync(command));

const ssh = new NodeSSH();

await ssh.connect({
  host: process.env.SSH_HOST,
  username: process.env.SSH_USERNAME,
  password: process.env.SSH_PASSWORD,
});

const images = [
  // flannel相关
  // "docker.io/flannel/flannel:v0.25.6",
  // "docker.io/flannel/flannel-cni-plugin:v1.5.1-flannel2",

  // longhorn相关
  // "docker.io/longhornio/longhorn-manager:v1.7.1",
  // "docker.io/longhornio/longhorn-ui:v1.7.1",
  // "docker.io/longhornio/longhorn-share-manager:v1.7.1",

  // ingress-nginx相关
  // "registry.k8s.io/ingress-nginx/kube-webhook-certgen:v1.4.3",
  // "registry.k8s.io/ingress-nginx/opentelemetry-1.25.3:v20240813-b933310d",
  // "registry.k8s.io/ingress-nginx/controller:v1.11.2"

  "registry.k8s.io/pause:3.8",
];

for (const image of images) {
  const tarname = `${image.replace(/\//g, "-")}.tar`;

  // 拉取镜像
  console.log("docker pull", $(`docker pull --platform=linux/amd64 ${image}`));
  // 将镜像导出成tar文件
  console.log("docker save", $(`docker save -o ${tarname} ${image}`));
  // 上传文件至服务器
  console.log("putFile", await ssh.putFile(`${tarname}`, `${tarname}`));
  // 远程服务器导入该镜像
  console.log(
    "load",
    // containerd
    // await ssh.execCommand(`
    //   ctr -n k8s.io image import ${tarname}
    //   rm -f ${tarname}
    // `)
    // docker
    await ssh.execCommand(`
      docker load < ${tarname}
      rm -f ${tarname}
    `)
  );
}

ssh.dispose();
