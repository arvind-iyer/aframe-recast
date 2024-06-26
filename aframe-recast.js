import * as THREE from 'three';
import {NavMeshHelper, threeToSoloNavMesh} from '@recast-navigation/three';

import {
    init as initRecastNavigation
} from '@recast-navigation/core';

function saveBlob(blob, filename) {
    var link = document.createElement('a');
    link.style.display = 'none';
    document.body.appendChild(link);
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename || 'ascene.html';
    link.click();
    URL.revokeObjectURL(url);
    link.remove();
  }

AFRAME.registerSystem(
    'recast', 
    {
        init: function() {
            initRecastNavigation().then((e) => console.log("initialized recast navigation. ", e));
        },
        bake: function(meshes, recastProps) {
            const {success, navMesh} = threeToSoloNavMesh(meshes, recastProps);
            if (success) {
                return navMesh;
            }
            return null;
        }
    }
)

AFRAME.registerComponent('recast', {
    schema: {
        bakeEvent: {default: 'bake', type: 'string'},
        cellSize: {default: 0.2, type: 'number'},
        cellHeight: {default: 0.2, type: 'number'},
        walkableSlopeAngle: {default: 35, type: 'number'},
        walkableHeight: {default: 1, type: 'number'},
        walkableClimb: {default: 1, type: 'number'},
        walkableRadius: {default: 1, type: 'number'},
        maxEdgeLen: {default: 12, type: 'number'},
        maxSimplificationError: {default: 1.3, type: 'number'},
        minRegionArea: {default: 8, type: 'number' },
        mergeRegionArea: {default: 20, type: 'number' },
        maxVertsPerPoly: {default: 6, type: 'number' },
        detailSampleDist: {default: 6, type: 'number' },
        detailSampleMaxError: {default: 1, type: 'number' }
    },
    init: function() {
        this.bake = this.onBakeEvent.bind(this);
        this.export  = this.exportToGLTF.bind(this);
        this.el.addEventListener(this.data.bakeEvent, this.bake);
        
    },
    update: function(oldData) {
        if (this.data.bakeEvent !== oldData.bakeEvent) {
            // reset the event handler
            this.el.removeEventListener(oldData.bakeEvent, this.bake);
            this.el.addEventListener(this.data.bakeEvent, this.bake);
        }
    },
    setNavMesh: function(navMeshObject) {
        
        this.navMeshEl = this.el.querySelector('#bakednavmesh');
        if (!this.navMeshEl) {
            this.navMeshEl = document.createElement('a-entity');
            this.navMeshEl.id = 'bakednavmesh';
            this.el.append(this.navMeshEl);
        }
        if (navMeshObject) {
            this.navMeshEl.object3D.add(navMeshObject);
        }
    },
    exportToGLTF() {
        if (!this.navMeshEl) return;
        console.log(this.navMeshEl);
        AFRAME.INSPECTOR.exporters.gltf.parse(
          this.navMeshEl.object3D,
          function (buffer) {
            const blob = new Blob([buffer], { type: 'application/octet-stream' });
            console.log(blob);
            saveBlob(blob, 'navmesh.glb');
          },
          function (error) {
            console.error(error);
          },
          { binary: true }
        );
    },
    onBakeEvent: function(e) {
        let meshes = [];
        this.el.object3D.traverse(n => {
            if (n.isMesh) {
                meshes.push(n);
            }
        });
        let recastProps = {
            ch: this.data.cellHeight,
            cs: this.data.cellSize,
            walkableSlopeAngle: this.data.walkableSlopeAngle,
            walkableHeight: this.data.walkableHeight,
            walkableClimb: this.data.walkableClimb,
            walkableRadius: this.data.walkableRadius,
            maxEdgeLen: this.data.maxEdgeLen,
            maxSimplificationError: this.data.maxSimplificationError,
            minRegionArea: this.data.minRegionArea,
            mergeRegionArea: this.data.mergeRegionArea,
            maxVertsPerPoly: this.data.maxVertsPerPoly,
            detailSampleDist: this.data.detailSampleDist,
            detailSampleMaxError: this.data.detailSampleMaxError,
        }
        let navMesh = this.system.bake(meshes, recastProps);


        if (navMesh !== null) {
            const navMeshObject = new NavMeshHelper({
                navMesh,
                navMeshMaterial: new THREE.MeshBasicMaterial({
                  color: 'red',
                  wireframe: true,
                }),
            });
            this.setNavMesh(navMeshObject)
        }

    }
})
