export default function IngestHint({ onClose }: { onClose?: () => void }) {
  return (
    <div className="callout">
      <div className="callout-head">
        <strong>How ingestion works</strong>
        <button className="link" onClick={onClose}>
          Close
        </button>
      </div>
      <ol className="callout-list">
        <li>
          Put your <code>.txt</code> or <code>.md</code> files in a folder.
        </li>
        <li>The app splits them into chunks and creates embeddings.</li>
        <li>Those embeddings are stored in Qdrant for fast retrieval.</li>
        <li>Now your questions can be answered using those documents.</li>
      </ol>
    </div>
  );
}
