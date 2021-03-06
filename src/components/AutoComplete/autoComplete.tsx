import React, { ReactElement, useEffect, useRef, useState, KeyboardEvent, ChangeEvent } from 'react'
import classNames from 'classnames'
import Input, { InputProps } from '../Input/input'
import { Transition } from 'react-transition-group'
import Icon from '../Icon/icon'
import useClickOutside from '../../Hooks/useClickOutside'
import useDebounce from '../../Hooks/useDebounce'

interface DataSourceObject {
  value: string
}
export type DataSourceType<T = {}> = T & DataSourceObject
export interface AutoCompleteProps extends Omit<InputProps, 'onSelect'> {
  /**
    * fetch 函数 支持返回一个promise
  */
  fetchSuggestions: (str: string) => DataSourceType[] | Promise<DataSourceType[]>
  /**
    * 选中的callback (item: {value： string}) => void
  */
  onSelect?: (item: DataSourceType) => void
  /**
    * 自定义渲染option (item: {value： string}) => ReactElement
  */
  renderOption?: (item: DataSourceType) => ReactElement
}
/**
* ### AutoComplete 自动完成
*
* 输入框自动完成功能。 
* ### 引用方法
* 
* ~~~js
* import { AutoComplete } from 'vship';
* ~~~
*/
export const AutoComplete: React.FC<AutoCompleteProps> = (props) => {
  const {
    fetchSuggestions,
    onSelect,
    value,
    renderOption
  } = props

  const [inputValue, setInputValue] = useState(value as string)
  const [suggestions, setSuggestions] = useState<DataSourceType[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const triggerSearch = useRef(false)
  const componentRef = useRef<HTMLDivElement>(null)
  const debouncedValue = useDebounce(inputValue, 300)
  useClickOutside(componentRef, () => { setSuggestions([]) })
  useEffect(() => {
    if (debouncedValue && triggerSearch.current) {
      setSuggestions([])
      const results = fetchSuggestions(debouncedValue)
      if (results instanceof Promise) {
        setLoading(true)
        results.then(data => {
          setLoading(false)
          setSuggestions(data)
          if (data.length > 0) {
            setShowDropdown(true)
          }
        })
      } else {
        setSuggestions(results)
        setShowDropdown(true)
        if (results.length > 0) {
          setShowDropdown(true)
        }
      }
    } else {
      setShowDropdown(false)
    }
    setHighlightIndex(-1)
  }, [debouncedValue, fetchSuggestions])
  const highlight = (index: number) => {
    if (index < 0) index = 0
    if (index >= suggestions.length) index = suggestions.length - 1
    setHighlightIndex(index)
  }
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.keyCode) {
      case 13:
        if (suggestions[highlightIndex]) {
          handleSelect(suggestions[highlightIndex])
        }
        break;
      case 38:
        highlight(highlightIndex - 1)
        break;
      case 40:
        highlight(highlightIndex + 1)
        break
      case 27:
        setShowDropdown(false)
        break;
      default:
        break;
    }
  }
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim()
    setInputValue(value)
    triggerSearch.current = true
  }
  const handleSelect = (item: DataSourceType) => {
    setInputValue(item.value)
    setShowDropdown(false)
    if (onSelect) {
      onSelect(item)
    }
    triggerSearch.current = false
  }
  const renderTemplate = (item: DataSourceType) => {
    return renderOption ? renderOption(item) : item.value
  }
  const generateDropdown = () => {
    if (!loading && !suggestions.length) return null
    return (
      <Transition
        in={showDropdown || loading}
        animation='zoom-in-top'
        timeout={300}
        onExited={() => setSuggestions([])}
      >
        <ul className='vship-suggestion-list'>
          {loading && 
            <div className='suggestions-loading-icon'>
              <Icon icon='spinner' spin theme='primary' />
            </div>
          }
          {/* @ts-ignore */}
          {suggestions.map((item, index) => {
            const cnames = classNames('suggestion-item',{
              'is-active': index === highlightIndex
            })
            return (
              <li key={index} className={cnames} onClick={()=> handleSelect(item)}>
                {renderTemplate(item)}
              </li>
            )
          })}
        </ul>
      </Transition>
    )
  }
  return (
    <div className='vship-auto-complete' ref={componentRef}>
      <Input
      value={inputValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      >
      </Input>
      {generateDropdown()}
    </div>
  )
}

export default AutoComplete;
