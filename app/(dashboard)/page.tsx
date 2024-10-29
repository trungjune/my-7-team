'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, Trash2, Plus } from 'lucide-react'

type Position = 'GK' | 'CB' | 'LM' | 'RM' | 'CM' | 'ST'

type Participant = {
  name: string
  skill: number
  position: Position
}

type Team = Participant[]

const positionNames: Record<Position, string> = {
  GK: 'Thủ môn',
  CB: 'Hậu vệ',
  LM: 'Cánh trái',
  RM: 'Cánh phải',
  CM: 'Tiền vệ',
  ST: 'Tiền đạo'
}

export default function TeamGenerator() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [numberOfTeams, setNumberOfTeams] = useState(2)
  const [bulkParticipants, setBulkParticipants] = useState('')
  const [name, setName] = useState('')
  const [skill, setSkill] = useState('3') // Giá trị mặc định cho kỹ năng
  const [position, setPosition] = useState<Position>('ST') // Giá trị mặc định cho vị trí

  const addParticipant = (name: string, skill: number, position: Position) => {
    if (name) {
      setParticipants([...participants, { name, skill, position }])
    }
  }

  const removeParticipant = (index: number) => {
    const updatedParticipants = participants.filter((_, i) => i !== index)
    setParticipants(updatedParticipants)
  }

  const updateParticipant = (index: number, field: keyof Participant, value: string | number) => {
    const updatedParticipants = [...participants]
    if (field === 'skill') {
      updatedParticipants[index][field] = value as number
    } else if (field === 'position') {
      updatedParticipants[index][field] = value as Position
    } else {
      updatedParticipants[index][field] = value as string
    }
    setParticipants(updatedParticipants)
  }

  const parseParticipantString = (str: string): Participant => {
    const parts = str.split(/[\s,;-]+/).filter(Boolean)
    const name = parts[0]
    let skill = 3
    let position: Position = 'ST'

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i]
      if (!isNaN(Number(part))) {
        skill = Number(part)
      } else if (Object.keys(positionNames).includes(part.toUpperCase())) {
        position = part.toUpperCase() as Position
      }
    }

    return { name, skill, position }
  }

  const importParticipants = () => {
    // Validate empty input
    if (!bulkParticipants || bulkParticipants.trim() === '') {
      alert('Vui lòng nhập dữ liệu người tham gia')
      return
    }

    try {
      const lines = bulkParticipants.split('\n')

      // Validate if there are any lines
      if (lines.length === 0) {
        alert('Dữ liệu không hợp lệ. Vui lòng nhập theo định dạng yêu cầu')
        return
      }

      const newParticipants = lines.map(parseParticipantString).filter(p => {
        // Additional validation for each participant
        if (!p || !p.name || p.name.trim() === '') {
          return false
        }
        return true
      })

      // Validate if any valid participants were parsed
      if (newParticipants.length === 0) {
        alert('Không tìm thấy dữ liệu người tham gia hợp lệ')
        return
      }

      setParticipants([...participants, ...newParticipants])
      setBulkParticipants('')
    } catch (error) {
      console.error('Lỗi khi import:', error)
      alert('Đã xảy ra lỗi khi xử lý dữ liệu. Vui lòng kiểm tra lại định dạng.')
    }
  }

  const generateTeams = () => {
    if (participants.length === 0) {
      alert('Chưa có người chơi nào trong danh sách. Vui lòng thêm người chơi trước khi tạo đội.')
      return
    }

    const shuffledParticipants = [...participants].sort(() => Math.random() - 0.5)
    const newTeams: Team[] = Array.from({ length: numberOfTeams }, () => [])

    // Distribute players evenly, ensuring minimal difference in team sizes
    const baseTeamSize = Math.floor(shuffledParticipants.length / numberOfTeams)
    const extraPlayers = shuffledParticipants.length % numberOfTeams

    let playerIndex = 0
    for (let i = 0; i < numberOfTeams; i++) {
      const teamSize = i < extraPlayers ? baseTeamSize + 1 : baseTeamSize
      newTeams[i] = shuffledParticipants.slice(playerIndex, playerIndex + teamSize)
      playerIndex += teamSize
    }

    // Balance teams based on priorities
    for (let i = 0; i < 1000; i++) {
      let improved = false

      // 1. Balance total points
      const teamScores = newTeams.map(team => team.reduce((sum, p) => sum + p.skill, 0))
      const maxScore = Math.max(...teamScores)
      const minScore = Math.min(...teamScores)

      if (maxScore - minScore > 1) {
        const maxTeam = newTeams[teamScores.indexOf(maxScore)]
        const minTeam = newTeams[teamScores.indexOf(minScore)]

        // Find the best pair of players to swap
        let bestSwap: [Participant, Participant] | null = null
        let bestScoreDiff = maxScore - minScore

        for (const playerFromMax of maxTeam) {
          for (const playerFromMin of minTeam) {
            const newMaxScore = maxScore - playerFromMax.skill + playerFromMin.skill
            const newMinScore = minScore - playerFromMin.skill + playerFromMax.skill
            const newScoreDiff = Math.abs(newMaxScore - newMinScore)

            if (newScoreDiff < bestScoreDiff) {
              bestScoreDiff = newScoreDiff
              bestSwap = [playerFromMax, playerFromMin]
            }
          }
        }

        // Perform the swap
        if (bestSwap) {
          const [playerFromMax, playerFromMin] = bestSwap
          maxTeam.splice(maxTeam.indexOf(playerFromMax), 1, playerFromMin)
          minTeam.splice(minTeam.indexOf(playerFromMin), 1, playerFromMax)
          improved = true
          continue
        }
      }

      // 2. Balance total number of people for each position
      const positions: Position[] = ['GK', 'CB', 'LM', 'RM', 'CM', 'ST']
      for (const position of positions) {
        const positionCounts = newTeams.map(team => team.filter(p => p.position === position).length)
        const maxCount = Math.max(...positionCounts)
        const minCount = Math.min(...positionCounts)

        if (maxCount - minCount > 1) {
          const maxTeam = newTeams[positionCounts.indexOf(maxCount)]
          const minTeam = newTeams[positionCounts.indexOf(minCount)]
          const playerToMove = maxTeam.find(p => p.position === position)
          const playerToSwap = minTeam.find(p => p.position !== position)
          if (playerToMove && playerToSwap) {
            maxTeam.splice(maxTeam.indexOf(playerToMove), 1, playerToSwap)
            minTeam.splice(minTeam.indexOf(playerToSwap), 1, playerToMove)
            improved = true
            break
          }
        }
      }

      if (improved) continue

      // 3. Balance total points for each position
      for (const position of positions) {
        const positionScores = newTeams.map(team =>
          team.filter(p => p.position === position).reduce((sum, p) => sum + p.skill, 0)
        )
        const maxScore = Math.max(...positionScores)
        const minScore = Math.min(...positionScores)

        if (maxScore - minScore > 1) {
          const maxTeam = newTeams[positionScores.indexOf(maxScore)]
          const minTeam = newTeams[positionScores.indexOf(minScore)]

          // Find the best pair of players to swap
          let bestSwap: [Participant, Participant] | null = null
          let bestScoreDiff = maxScore - minScore

          for (const playerFromMax of maxTeam.filter(p => p.position === position)) {
            for (const playerFromMin of minTeam.filter(p => p.position === position)) {
              const newMaxScore = maxScore - playerFromMax.skill + playerFromMin.skill
              const newMinScore = minScore - playerFromMin.skill + playerFromMax.skill
              const newScoreDiff = Math.abs(newMaxScore - newMinScore)

              if (newScoreDiff < bestScoreDiff) {
                bestScoreDiff = newScoreDiff
                bestSwap = [playerFromMax, playerFromMin]
              }
            }
          }

          // Perform the swap
          if (bestSwap) {
            const [playerFromMax, playerFromMin] = bestSwap
            maxTeam.splice(maxTeam.indexOf(playerFromMax), 1, playerFromMin)
            minTeam.splice(minTeam.indexOf(playerFromMin), 1, playerFromMax)
            improved = true
            break
          }
        }
      }

      if (!improved) break // If no improvements were made in this iteration, we're done
    }

    setTeams(newTeams)
  }

  const getPositionStats = (team: Team) => {
    return Object.entries(positionNames).map(([pos, name]) => {
      const positionPlayers = team.filter(p => p.position === pos)
      const count = positionPlayers.length
      const totalScore = positionPlayers.reduce((sum, p) => sum + p.skill, 0)
      return { position: pos as Position, name, count, totalScore }
    })
  }
  const getPositionDisplay = (position: Position) => `${position} (${positionNames[position]})`

  useEffect(() => {
    const handleResize = () => {
      const teamContainer = document.querySelector('.team-container')
      if (teamContainer) {
        const columns = window.innerWidth < 640 ? 1 : Math.min(numberOfTeams, 3)
        teamContainer.className = `team-container grid gap-4 grid-cols-1 sm:grid-cols-${columns}`
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize() // Initial call

    return () => window.removeEventListener('resize', handleResize)
  }, [numberOfTeams, teams])

  const handleAddParticipant = () => {
    if (!name.trim()) {
      alert('Chưa nhập tên người chơi')
      return
    }

    // Gọi hàm để thêm người chơi
    addParticipant(name, parseInt(skill), position)

    // Đặt lại các giá trị
    setName('') // Đặt lại giá trị input tên
    setSkill('3') // Đặt lại giá trị kỹ năng về mặc định
    setPosition('ST') // Đặt lại giá trị vị trí về mặc định
  }

  const getGridClassName = () => {
    switch (numberOfTeams) {
      case 2:
        return 'grid grid-cols-2 gap-4'
      case 3:
        return 'grid grid-cols-3 gap-4'
      case 4:
        return 'grid grid-cols-2 gap-4'
      case 6:
        return 'grid grid-cols-3 gap-4'
      default:
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
    }
  }

  return (
    <div className='min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-7xl mx-auto'>
        <h1 className='text-3xl font-bold text-center mb-8'>Trình tạo đội bóng ngẫu nhiên</h1>

        <Card className='mb-8'>
          <CardHeader>
            <CardTitle>Thêm người chơi</CardTitle>
            <CardDescription>Thêm người chơi một cách đơn lẻ hoặc hàng loạt</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid gap-4'>
              <div className='grid grid-cols-[3fr,1fr,1fr,auto] gap-2 items-end'>
                <Label htmlFor='playerName'>Tên</Label>
                <Label htmlFor='playerSkill'>Kỹ năng</Label>
                <Label htmlFor='playerPosition'>Vị trí</Label>
                <div></div>
                <Input
                  placeholder='Tên người chơi'
                  id='playerName'
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
                <Select value={skill} onValueChange={setSkill}>
                  <SelectTrigger>
                    <SelectValue placeholder='Kỹ năng' />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(skill => (
                      <SelectItem key={skill} value={skill.toString()}>
                        {skill}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={position} onValueChange={value => setPosition(value as Position)}>
                  <SelectTrigger>
                    <SelectValue placeholder='Vị trí' />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(positionNames).map(([key, value]) => (
                      <SelectItem key={key} value={key as Position}>
                        {getPositionDisplay(key as Position)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddParticipant}>
                  <Plus className='h-4 w-4' />
                </Button>
              </div>
              <Textarea
                className='h-36'
                placeholder={
                  'Sao chép và dán danh sách người chơi. Mỗi người chơi một dòng,\n' +
                  'Theo định dạng: Tên KỹNăng VịTrí\n' +
                  'ví dụ: NguyenVanA 3 ST\n' +
                  'hoặc NguyenVanA, 3, ST\n' +
                  'hoặc NguyenVanA; 3; ST\n' +
                  'hoặc NguyenVanA - 3 - ST'
                }
                value={bulkParticipants}
                onChange={e => setBulkParticipants(e.target.value)}
              />
              <Button onClick={importParticipants}>Nhập danh sách</Button>
            </div>
          </CardContent>
        </Card>

        <Card className='mb-8'>
          <CardHeader className='px-4 pb-3'>
            <CardTitle>Danh sách người chơi</CardTitle>
            <CardDescription>Danh sách người chơi đã thêm</CardDescription>
          </CardHeader>
          <CardContent className='px-4'>
            <div className='grid gap-1.5'>
              <div className='grid grid-cols-[40px,1.5fr,0.8fr,0.8fr,50px] gap-1.5 font-bold text-center'>
                <div>STT</div>
                <div>Tên</div>
                <div>Kỹ năng</div>
                <div>Vị trí</div>
                <div></div>
              </div>
              {participants.map((p, index) => (
                <div key={index} className='grid grid-cols-[40px,1.5fr,0.8fr,0.8fr,50px] gap-1.5 items-center'>
                  <div className='text-center text-sm'>{index + 1}</div>
                  <Input
                    value={p.name}
                    onChange={e => updateParticipant(index, 'name', e.target.value)}
                    className='h-8'
                  />
                  <Select
                    value={p.skill.toString()}
                    onValueChange={value => updateParticipant(index, 'skill', parseInt(value))}
                  >
                    <SelectTrigger className='text-center h-8'>
                      <SelectValue placeholder='Kỹ năng' />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map(skill => (
                        <SelectItem key={skill} value={skill.toString()}>
                          {skill}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={p.position}
                    onValueChange={value => updateParticipant(index, 'position', value as Position)}
                  >
                    <SelectTrigger className='text-center h-8'>
                      <SelectValue placeholder='Vị trí' />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(positionNames).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {getPositionDisplay(key as Position)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant='outline' size='icon' className='h-8 w-8' onClick={() => removeParticipant(index)}>
                    <Trash2 className='h-3.5 w-3.5' />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className='mb-8'>
          <CardHeader>
            <CardTitle>Tạo đội</CardTitle>
            <CardDescription>Chọn số lượng đội và tạo đội</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid gap-4'>
              <div className='flex flex-wrap items-center gap-4'>
                <Label htmlFor='teams'>Số lượng đội</Label>
                <Select value={numberOfTeams.toString()} onValueChange={value => setNumberOfTeams(Number(value))}>
                  <SelectTrigger className='w-[100px]'>
                    <SelectValue placeholder='Số đội' />
                  </SelectTrigger>
                  <SelectContent>
                    {[2, 3, 4, 5, 6].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={generateTeams}>Tạo đội</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {teams.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Kết quả chia đội</CardTitle>
              <CardDescription>Các đội được tạo ngẫu nhiên dựa trên danh sách người chơi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid gap-8'>
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='bg-gray-100'>
                        <th className='p-2 text-left'>Vị trí</th>
                        {teams.map((_, index) => (
                          <th key={index} className='p-2 text-center'>
                            Đội {index + 1}
                          </th>
                        ))}
                        <th className='p-2 text-center'>Tổng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(positionNames).map(([pos, name]) => {
                        const teamStats = teams.map(team => getPositionStats(team).find(s => s.position === pos))
                        const totalCount = teamStats.reduce((sum, stat) => sum + (stat?.count || 0), 0)
                        const totalScore = teamStats.reduce((sum, stat) => sum + (stat?.totalScore || 0), 0)
                        return (
                          <tr key={pos} className='border-b'>
                            <td className='p-2'>{getPositionDisplay(pos as Position)}</td>
                            {teamStats.map((stat, index) => (
                              <td key={index} className='p-2 text-center'>
                                {stat?.count ? `${stat.count} người (${stat.totalScore}đ)` : '-'}
                              </td>
                            ))}
                            <td className='p-2 text-center font-bold'>
                              {totalCount > 0 ? `${totalCount} người (${totalScore}đ)` : '-'}
                            </td>
                          </tr>
                        )
                      })}
                      <tr className='bg-gray-100 font-bold'>
                        <td className='p-2'>Tổng</td>
                        {teams.map((team, index) => (
                          <td key={index} className='p-2 text-center'>
                            {team.length} người ({team.reduce((sum, p) => sum + p.skill, 0)}đ)
                          </td>
                        ))}
                        <td className='p-2 text-center'>
                          {participants.length} người ({participants.reduce((sum, p) => sum + p.skill, 0)}đ)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className={getGridClassName()}>
                  {teams.map((team, index) => (
                    <div key={index} className='border p-4 rounded-lg'>
                      <h3 className='font-bold mb-2'>
                        Đội {index + 1} (Tổng điểm: {team.reduce((sum, p) => sum + p.skill, 0)}, Số người: {team.length}
                        )
                      </h3>
                      <div className='space-y-2'>
                        {Object.entries(positionNames).map(([position, positionName]) => {
                          const positionPlayers = team.filter(p => p.position === position)
                          return (
                            <div key={position}>
                              <h4 className='font-semibold'>{getPositionDisplay(position as Position)}:</h4>
                              {positionPlayers.length > 0 ? (
                                <ul className='list-disc pl-5'>
                                  {positionPlayers.map((member, memberIndex) => (
                                    <li key={memberIndex} className='mb-1'>
                                      <span
                                        className='inline-block max-w-[150px] truncate align-bottom'
                                        title={member.name}
                                      >
                                        {member.name}
                                      </span>
                                      <span className='ml-2'>({member.skill})</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className='text-red-500 pl-5'>Thiếu người chơi</p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className='flex justify-center mt-4'>
                <Button variant='outline' onClick={generateTeams}>
                  <RefreshCw className='h-4 w-4 mr-2' /> Tạo lại đội
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
