import ILInstructorCard from "./ILInstructorCard";
import InstructorEmptyState from "../InstructorEmptyState";

export default function ILInstructorGrid({ instructors, viewMode }) {
  if (instructors.length === 0) {
    return (
      <div className={`il-inst-grid${viewMode === "list" ? " list-view" : ""}`}>
        <InstructorEmptyState
          title="No Instructors Found"
          description="Try adjusting filters or search to discover more instructors."
          compact
        />
      </div>
    );
  }

  return (
    <div className={`il-inst-grid${viewMode === "list" ? " list-view" : ""}`}>
      {instructors.map((inst, i) => (
        <ILInstructorCard
          key={inst.id}
          instructor={inst}
          viewMode={viewMode}
          index={i}
        />
      ))}
    </div>
  );
}
