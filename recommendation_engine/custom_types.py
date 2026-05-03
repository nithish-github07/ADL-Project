import pydantic


class RAGChunkAndSrc(pydantic.BaseModel):
    chunks:list[str]
    source_id:str=None

class RAGUpsertResult(pydantic.BaseModel):
    ingested:int

class RAGSearchResult(pydantic.BaseModel):
    contexts:list[str]
    sources:list[str]

class RAGQueryResult(pydantic.BaseModel):
    answer:str
    sources:list[str]
    num_contexts:int


class LearningPathResource(pydantic.BaseModel):
    type: str = "link"
    title: str
    url: str = ""

class LearningPathModule(pydantic.BaseModel):
    moduleId: str
    title: str
    description: str = ""
    duration: int = 0
    resources: list[LearningPathResource] = []

class LearningPathRequest(pydantic.BaseModel):
    targetJobRole: str | None = None
    targetSector: str | None = None
    currentLevel: str = "beginner"
    targetLevel: str = "advanced"
    qualification: str | None = None
    technicalSkills: list[str] = []
    softSkills: list[str] = []
    workExperience: list[dict] = []
    certifications: list[dict] = []
    engagementStatus: str | None = None
    hoursPerWeek: int | None = None
    preferredMode: str | None = None
    learningPreferences: str | None = None
    preferredLanguages: list[str] = []
    timeline: int = 90

class LearningPathResponse(pydantic.BaseModel):
    title: str
    description: str
    modules: list[LearningPathModule]
    estimatedDuration: int
    sources: list[str] = []
