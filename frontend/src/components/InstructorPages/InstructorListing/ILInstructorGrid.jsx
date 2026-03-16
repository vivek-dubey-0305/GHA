import ILInstructorCard from "./ILInstructorCard";

export default function ILInstructorGrid({ instructors, viewMode }) {
  if (instructors.length === 0) {
    return (
      <div className={`il-inst-grid${viewMode === "list" ? " list-view" : ""}`}>
        <div className="il-no-res">
          No instructors found. <span>Try adjusting filters.</span>
        </div>
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
