// Types
export interface Commit {
    id: string
    sha: string
    message: string
    author: string
    date: string
  }
  
  export interface Repository {
    id: string
    githubId: string
    name: string
    fullName: string
    starred: boolean
    description: string
    url: string
    commits: Commit[]
    languages?: Record<string, number> | null
  }
  