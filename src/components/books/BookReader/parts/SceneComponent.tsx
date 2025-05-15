import React from 'react';
import { IScene } from '@/entities/BookEntities';
import styles from '../BookReader.module.css';

interface SceneProps {
  scene: IScene;
}

export const SceneComponent: React.FC<SceneProps> = ({ scene }) => (
    <div id={`scene-${scene.id}`} data-scene>
      <h3 className={styles.sceneTitle}>{scene.title}</h3>
      <div
          dangerouslySetInnerHTML={{ __html: scene.body }}
          className={styles.contentBody}
      />
    </div>
);
