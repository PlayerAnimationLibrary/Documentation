import React, {useRef, useState} from 'react';
import styles from './FileDrop.module.css';

type Props = {
  title: string;
  hint: string;
  accept: string;
  onFile: (file: File) => void;
};

/** A dashed area that takes a file either dropped onto it or picked after a click. */
export default function FileDrop({title, hint, accept, onFile}: Props): React.ReactElement {
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  return (
    <div
      className={over ? `${styles.drop} ${styles.dropOver}` : styles.drop}
      onClick={() => input.current?.click()}
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        const file = event.dataTransfer.files[0];
        if (file) onFile(file);
      }}>
      <span className={styles.dropTitle}>{title}</span>
      <span className={styles.dropHint}>{hint}</span>
      <input
        ref={input}
        className={styles.hidden}
        type="file"
        accept={accept}
        onChange={(event) => {
          const file = event.target.files?.[0];
          // Otherwise picking the same file again, say after saving it once more, does nothing
          event.target.value = '';
          if (file) onFile(file);
        }}
      />
    </div>
  );
}
